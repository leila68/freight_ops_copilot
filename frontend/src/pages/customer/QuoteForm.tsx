import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Field } from "@/components/ui/Field"
import { Checkbox } from "@/components/ui/Checkbox"
import { LoadingState, ErrorState } from "@/components/ui/States"
import { useAsync } from "@/hooks/useAsync"
import { equipmentApi, accessorialApi, laneApi } from "@/api/freight"
import { formatCurrency } from "@/lib/format"
import type { QuoteCalculateRequest } from "@/types"
import { RotateCcw } from "lucide-react"

interface QuoteFormProps {
  onChange: (payload: QuoteCalculateRequest | null) => void
  locked: boolean    // true while booking or booked — disables all inputs
  onReset: () => void
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

function CitySelect({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  cities,
}: {
  id: string
  value: string
  onChange: (city: string, province: string) => void
  placeholder: string
  disabled?: boolean
  cities: { city: string; province_code: string }[]
}) {
  const [search, setSearch] = useState(value)
  const [open, setOpen] = useState(false)

  useEffect(() => { setSearch(value) }, [value])

  const filtered = search.length < 1
    ? cities
    : cities.filter((c) =>
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
        onBlur={() => {
          setTimeout(() => {
            setOpen(false)
            const match = cities.find(
              (c) => c.city.toLowerCase() === search.toLowerCase()
            )
            if (!match) setSearch(value) // revert free-typed text that isn't a valid option
          }, 150)
        }}
        placeholder={placeholder}
        autoComplete="off"
        disabled={disabled}
      />
      {!disabled && open && filtered.length > 0 && (
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

export function QuoteForm({ onChange, locked, onReset }: QuoteFormProps) {
  const equipment = useAsync(() => equipmentApi.list(), [])
  const accessorials = useAsync(() => accessorialApi.list(), [])
  const lanePairs = useAsync(() => laneApi.cityPairs(), [])

  const [form, setForm] = useState(emptyForm)
  const [selectedAccessorials, setSelectedAccessorials] = useState<string[]>([])

  // Derive valid origins and the destination list scoped to the selected origin
  const { origins, destinationsByOrigin } = useMemo(() => {
    const pairs = lanePairs.data ?? []
    const originMap = new Map<string, { city: string; province_code: string }>()
    const destMap = new Map<string, { city: string; province_code: string }[]>()

    for (const p of pairs) {
      const originKey = `${p.origin_city}|${p.origin_province}`
      if (!originMap.has(originKey)) {
        originMap.set(originKey, { city: p.origin_city, province_code: p.origin_province })
      }

      const dest = { city: p.destination_city, province_code: p.destination_province }
      const list = destMap.get(originKey) ?? []
      list.push(dest)
      destMap.set(originKey, list)
    }

    return { origins: [...originMap.values()], destinationsByOrigin: destMap }
  }, [lanePairs.data])

  const originKey = `${form.origin_city}|${form.origin_province}`
  const availableDestinations = form.origin_city ? destinationsByOrigin.get(originKey) ?? [] : []

  // Notify parent whenever form changes — passes null if required fields missing
  useEffect(() => {
    const allFilled =
      form.origin_city &&
      form.origin_province &&
      form.destination_city &&
      form.destination_province &&
      form.equipment_type_id &&
      form.total_weight &&
      form.pickup_date

    if (!allFilled) {
      onChange(null)
      return
    }

    onChange({
      origin_city: form.origin_city,
      origin_province: form.origin_province,
      destination_city: form.destination_city,
      destination_province: form.destination_province,
      equipment_type_id: form.equipment_type_id,
      total_weight: Number(form.total_weight),
      pickup_date: form.pickup_date,
      accessorial_ids: selectedAccessorials,
    })
  }, [form, selectedAccessorials])

  const handleReset = () => {
    setForm(emptyForm)
    setSelectedAccessorials([])
    onReset()
  }

  const set = (key: keyof typeof emptyForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleCityChange = (side: "origin" | "destination", city: string, province: string) => {
    if (side === "origin") {
      setForm((f) => ({
        ...f,
        origin_city: city,
        origin_province: province,
        destination_city: "",
        destination_province: "",
      }))
    } else {
      setForm((f) => ({ ...f, destination_city: city, destination_province: province }))
    }
  }

  const toggleAccessorial = (id: string) => {
    setSelectedAccessorials((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const referenceLoading = equipment.loading || accessorials.loading || lanePairs.loading
  const referenceError = equipment.error || accessorials.error || lanePairs.error

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Shipment details</CardTitle>
            <CardDescription className="mt-1">
              The quote on the right updates automatically as you fill in details.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={handleReset} className="shrink-0 text-muted-foreground">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {referenceLoading ? (
          <LoadingState label="Loading options..." />
        ) : referenceError ? (
          <ErrorState
            message={referenceError}
            onRetry={() => {
              equipment.refetch().catch(() => {})
              accessorials.refetch().catch(() => {})
              lanePairs.refetch().catch(() => {})
            }}
          />
        ) : (
          <div className="flex flex-col gap-5">

            {/* Origin */}
            <fieldset className="flex flex-col gap-3" disabled={locked}>
              <legend className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Origin
              </legend>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Field label="City" htmlFor="origin_city" required>
                    <CitySelect
                      id="origin_city"
                      value={form.origin_city}
                      cities={origins}
                      placeholder="Search city..."
                      onChange={(city, province) => handleCityChange("origin", city, province)}
                      disabled={locked}
                    />
                  </Field>
                </div>
                <Field label="Province" htmlFor="origin_province">
                  <Input id="origin_province" value={form.origin_province} readOnly
                    className="bg-muted text-muted-foreground" placeholder="Auto" />
                </Field>
              </div>
            </fieldset>

            {/* Destination */}
            <fieldset className="flex flex-col gap-3" disabled={locked}>
              <legend className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Destination
              </legend>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Field label="City" htmlFor="destination_city" required>
                    <CitySelect
                      id="destination_city"
                      value={form.destination_city}
                      cities={availableDestinations}
                      placeholder={form.origin_city ? "Search city..." : "Select an origin first"}
                      onChange={(city, province) => handleCityChange("destination", city, province)}
                      disabled={locked || !form.origin_city}
                    />
                  </Field>
                </div>
                <Field label="Province" htmlFor="destination_province">
                  <Input id="destination_province" value={form.destination_province} readOnly
                    className="bg-muted text-muted-foreground" placeholder="Auto" />
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
                  disabled={locked}
                  options={(equipment.data ?? []).map((e) => ({
                    value: e.id,
                    label: e.name,
                  }))}
                />
              </Field>
              <Field label="Total weight (lbs)" htmlFor="weight" required>
                <Input id="weight" type="number" min={1}
                  value={form.total_weight} onChange={set("total_weight")}
                  placeholder="12000" disabled={locked} />
              </Field>
              <Field label="Pickup date" htmlFor="pickup" required>
                <Input id="pickup" type="date" value={form.pickup_date}
                  onChange={set("pickup_date")} disabled={locked} />
              </Field>
            </div>

            {/* Accessorials */}
            {(accessorials.data ?? []).length > 0 && (
              <Field label="Accessorials (optional)" htmlFor="accessorials">
                <div className={`grid grid-cols-1 gap-2 rounded-md border border-border p-3 sm:grid-cols-2 ${locked ? "pointer-events-none opacity-60" : ""}`}>
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
          </div>
        )}
      </CardContent>
    </Card>
  )
}