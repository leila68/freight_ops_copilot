import { useState, useEffect } from "react"
import { Calculator } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Field } from "@/components/ui/Field"
import { Checkbox } from "@/components/ui/Checkbox"
import { LoadingState, ErrorState } from "@/components/ui/States"
import { useAsync } from "@/hooks/useAsync"
import { equipmentApi, accessorialApi } from "@/api/freight"
import { formatCurrency } from "@/lib/format"
import { CANADIAN_CITIES } from "@/data/canadianCities"
import type { QuoteCalculateRequest } from "@/types"

interface QuoteFormProps {
  onSubmit: (payload: QuoteCalculateRequest) => void
  submitting: boolean
}

const emptyForm = {
  origin_city: "",
  origin_province: "",
  destination_city: "",
  destination_province: "",
  equipment_type_id: "",
  total_weight: "",
  pickup_date: "",
}

// Reusable searchable city dropdown (same pattern as ManageLanes)
function CitySelect({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string
  value: string
  onChange: (city: string, province: string) => void
  placeholder: string
}) {
  const [search, setSearch] = useState(value)
  const [open, setOpen] = useState(false)

  useEffect(() => { setSearch(value) }, [value])

  const filtered = search.length < 1
    ? CANADIAN_CITIES
    : CANADIAN_CITIES.filter((c) =>
        c.city.toLowerCase().startsWith(search.toLowerCase()) ||
        c.province_code.toLowerCase().startsWith(search.toLowerCase())
      )

  return (
    <div className="relative">
      <Input
        id={id}
        value={search}
        onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        autoComplete="off"
        required
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-border bg-card shadow-md">
          {filtered.map((c) => (
            <button
              key={`${c.city}-${c.province_code}`}
              type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-muted"
              onMouseDown={() => {
                onChange(c.city, c.province_code)
                setSearch(c.city)
                setOpen(false)
              }}
            >
              <span>{c.city}</span>
              <span className="text-muted-foreground">{c.province_code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function QuoteForm({ onSubmit, submitting }: QuoteFormProps) {
  const equipment = useAsync(() => equipmentApi.list(), [])
  const accessorials = useAsync(() => accessorialApi.list(), [])

  const [form, setForm] = useState(emptyForm)
  const [selectedAccessorials, setSelectedAccessorials] = useState<string[]>([])

  const set = (key: keyof typeof emptyForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleCityChange = (side: "origin" | "destination", city: string, province: string) => {
    if (side === "origin") {
      setForm((f) => ({ ...f, origin_city: city, origin_province: province }))
    } else {
      setForm((f) => ({ ...f, destination_city: city, destination_province: province }))
    }
  }

  const toggleAccessorial = (id: string) => {
    setSelectedAccessorials((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      origin_city: form.origin_city,
      origin_province: form.origin_province,
      destination_city: form.destination_city,
      destination_province: form.destination_province,
      equipment_type_id: form.equipment_type_id,
      total_weight: Number(form.total_weight),
      pickup_date: form.pickup_date,
      accessorial_ids: selectedAccessorials,
    })
  }

  const referenceLoading = equipment.loading || accessorials.loading
  const referenceError = equipment.error || accessorials.error

  return (
    <Card>
      <CardHeader>
        <CardTitle>Get a quote</CardTitle>
        <CardDescription>
          Enter shipment details to calculate an instant rate.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {referenceLoading ? (
          <LoadingState label="Loading quote options..." />
        ) : referenceError ? (
          <ErrorState
            message={referenceError}
            onRetry={() => {
              equipment.refetch().catch(() => {})
              accessorials.refetch().catch(() => {})
            }}
          />
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Origin */}
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Origin
              </legend>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Field label="City" htmlFor="origin_city" required>
                    <CitySelect
                      id="origin_city"
                      value={form.origin_city}
                      placeholder="Search city..."
                      onChange={(city, province) => handleCityChange("origin", city, province)}
                    />
                  </Field>
                </div>
                <Field label="Province" htmlFor="origin_province">
                  <Input
                    id="origin_province"
                    value={form.origin_province}
                    readOnly
                    className="bg-muted text-muted-foreground"
                    placeholder="Auto"
                  />
                </Field>
              </div>
            </fieldset>

            {/* Destination */}
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Destination
              </legend>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Field label="City" htmlFor="destination_city" required>
                    <CitySelect
                      id="destination_city"
                      value={form.destination_city}
                      placeholder="Search city..."
                      onChange={(city, province) => handleCityChange("destination", city, province)}
                    />
                  </Field>
                </div>
                <Field label="Province" htmlFor="destination_province">
                  <Input
                    id="destination_province"
                    value={form.destination_province}
                    readOnly
                    className="bg-muted text-muted-foreground"
                    placeholder="Auto"
                  />
                </Field>
              </div>
            </fieldset>

            {/* Equipment, weight, date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Equipment type" htmlFor="equipment" required>
                <Select
                  id="equipment"
                  value={form.equipment_type_id}
                  onChange={set("equipment_type_id")}
                  placeholder="Select type"
                  required
                  options={(equipment.data ?? []).map((e) => ({
                    value: e.id,
                    label: e.name,
                  }))}
                />
              </Field>
              <Field label="Total weight (lbs)" htmlFor="weight" required>
                <Input
                  id="weight"
                  type="number"
                  min={1}
                  value={form.total_weight}
                  onChange={set("total_weight")}
                  placeholder="12000"
                  required
                />
              </Field>
              <Field label="Pickup date" htmlFor="pickup" required>
                <Input
                  id="pickup"
                  type="date"
                  value={form.pickup_date}
                  onChange={set("pickup_date")}
                  required
                />
              </Field>
            </div>

            {/* Accessorials */}
            {(accessorials.data ?? []).length > 0 && (
              <Field label="Accessorials (optional)" htmlFor="accessorials">
                <div className="grid grid-cols-1 gap-2 rounded-md border border-border p-3 sm:grid-cols-2">
                  {(accessorials.data ?? []).map((a) => (
                    <Checkbox
                      key={a.id}
                      checked={selectedAccessorials.includes(a.id)}
                      onChange={() => toggleAccessorial(a.id)}
                      label={`${a.name} (+${
                        a.charge_type === "flat"
                          ? formatCurrency(Number(a.amount))
                          : `${a.amount}%`
                      })`}
                    />
                  ))}
                </div>
              </Field>
            )}

            {/* Hint if no lane will match */}
            {form.origin_city && form.destination_city && (
              <p className="text-xs text-muted-foreground">
                Rates are based on pre-configured lanes. If no rate is found for your route,
                please contact us for a custom quote.
              </p>
            )}

            <Button
              type="submit"
              loading={submitting}
              className="self-start"
              disabled={!form.origin_city || !form.destination_city || !form.equipment_type_id}
            >
              <Calculator className="h-4 w-4" />
              Calculate quote
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}