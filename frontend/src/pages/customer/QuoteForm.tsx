import { useState } from "react"
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

export function QuoteForm({ onSubmit, submitting }: QuoteFormProps) {
  const equipment = useAsync(() => equipmentApi.list(), [])
  const accessorials = useAsync(() => accessorialApi.list(), [])

  const [form, setForm] = useState(emptyForm)
  const [selectedAccessorials, setSelectedAccessorials] = useState<string[]>([])

  const set = (key: keyof typeof emptyForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => setForm((f) => ({ ...f, [key]: e.target.value }))

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

  // Block submit until reference data has loaded.
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
            <fieldset className="flex flex-col gap-4">
              <legend className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Origin
              </legend>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="City" htmlFor="origin_city" required className="sm:col-span-2">
                  <Input
                    id="origin_city"
                    value={form.origin_city}
                    onChange={set("origin_city")}
                    placeholder="Toronto"
                    required
                  />
                </Field>
                <Field label="Province" htmlFor="origin_province" required>
                  <Input
                    id="origin_province"
                    value={form.origin_province}
                    onChange={set("origin_province")}
                    placeholder="ON"
                    required
                  />
                </Field>
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-4">
              <legend className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Destination
              </legend>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="City" htmlFor="dest_city" required className="sm:col-span-2">
                  <Input
                    id="dest_city"
                    value={form.destination_city}
                    onChange={set("destination_city")}
                    placeholder="Montreal"
                    required
                  />
                </Field>
                <Field label="Province" htmlFor="dest_province" required>
                  <Input
                    id="dest_province"
                    value={form.destination_province}
                    onChange={set("destination_province")}
                    placeholder="QC"
                    required
                  />
                </Field>
              </div>
            </fieldset>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Equipment type" htmlFor="equipment" required>
                <Select
                  id="equipment"
                  value={form.equipment_type_id}
                  onChange={set("equipment_type_id")}
                  placeholder="Select equipment"
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
                  placeholder="42000"
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

            <Field label="Accessorials" htmlFor="accessorials">
              <div className="grid grid-cols-1 gap-2 rounded-md border border-border p-3 sm:grid-cols-2">
                {(accessorials.data ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No accessorials available.
                  </p>
                )}
                {(accessorials.data ?? []).map((a) => (
                  <Checkbox
                    key={a.id}
                    checked={selectedAccessorials.includes(a.id)}
                    onChange={() => toggleAccessorial(a.id)}
                    label={`${a.name} (+${
                      a.charge_type === "flat" ? formatCurrency(a.amount) : `${a.amount}%`
                    })`}
                  />
                ))}
              </div>
            </Field>

            <Button type="submit" loading={submitting} className="self-start">
              <Calculator className="h-4 w-4" />
              Calculate quote
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
