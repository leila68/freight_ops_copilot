import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Field } from "@/components/ui/Field"
import { Modal } from "@/components/ui/Modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States"
import { useAsync } from "@/hooks/useAsync"
import { getErrorMessage } from "@/api/client"
import { laneApi } from "@/api/freight"
import { formatCurrency } from "@/lib/format"
import { CANADIAN_CITIES, lookupDistance } from "@/data/canadianCities"
import type { Lane } from "@/types"

type LaneForm = Omit<Lane, "id" | "is_active">

const RATE_PER_KM = 0.96

const emptyForm: LaneForm = {
  origin_city: "",
  origin_province: "",
  destination_city: "",
  destination_province: "",
  base_rate: 0,
  distance_km: 0,
  transit_days: 1,
}

// Searchable city dropdown
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
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-border bg-card shadow-md">
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

export function ManageLanes() {
  const resource = useAsync(laneApi.list, [])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Lane | null>(null)
  const [form, setForm] = useState<LaneForm>(emptyForm)
  const [adjustment, setAdjustment] = useState<number>(0)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Lane | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [distanceAuto, setDistanceAuto] = useState<boolean>(false)

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setAdjustment(0)
    setFormError(null)
    setDistanceAuto(false)
    setModalOpen(true)
  }

  const openEdit = (lane: Lane) => {
    setEditing(lane)
    const distKm = Number(lane.distance_km)
    const baseRate = Number(lane.base_rate)
    const autoRate = Math.round(distKm * RATE_PER_KM)
    // Reverse-calculate adjustment from saved base_rate vs auto rate
    setAdjustment(baseRate - autoRate)
    setForm({
      origin_city: lane.origin_city,
      origin_province: lane.origin_province,
      destination_city: lane.destination_city,
      destination_province: lane.destination_province,
      base_rate: baseRate,
      distance_km: distKm,
      transit_days: lane.transit_days,
    })
    setFormError(null)
    setDistanceAuto(false)
    setModalOpen(true)
  }

  const handleCityChange = (
    side: "origin" | "destination",
    city: string,
    province: string,
  ) => {
    setForm((current) => {
      const newForm = side === "origin"
        ? { ...current, origin_city: city, origin_province: province }
        : { ...current, destination_city: city, destination_province: province }

      const originCity = side === "origin" ? city : current.origin_city
      const destCity = side === "destination" ? city : current.destination_city

      if (originCity && destCity) {
        const found = lookupDistance(originCity, destCity)
        if (found) {
          setDistanceAuto(true)
          setAdjustment(0)
          const autoRate = Math.round(found * RATE_PER_KM)
          return { ...newForm, distance_km: found, base_rate: autoRate }
        }
      }
      setDistanceAuto(false)
      return newForm
    })
  }

  // When distance is typed manually, recalculate base rate
  const handleDistanceChange = (km: number) => {
    setDistanceAuto(false)
    const autoRate = Math.round(km * RATE_PER_KM)
    setForm((f) => ({ ...f, distance_km: km, base_rate: autoRate + adjustment }))
  }

  // When adjustment changes, update final base_rate
  const handleAdjustmentChange = (adj: number) => {
    setAdjustment(adj)
    setForm((f) => ({
      ...f,
      base_rate: Math.round(f.distance_km * RATE_PER_KM) + adj,
    }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSaving(true)
    try {
      if (editing) {
        await laneApi.update(editing.id, form)
      } else {
        await laneApi.create(form)
      }
      setModalOpen(false)
      await resource.refetch()
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await laneApi.remove(deleteTarget.id)
      setDeleteTarget(null)
      await resource.refetch()
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const lanes = resource.data ?? []
  const autoRate = Math.round(form.distance_km * RATE_PER_KM)

  return (
    <div>
      <PageHeader
        title="Lanes"
        description="Manage origin–destination lanes and their base rates."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add lane
          </Button>
        }
      />

      <Card>
        <CardContent>
          {resource.loading ? (
            <LoadingState label="Loading lanes..." />
          ) : resource.error ? (
            <ErrorState message={resource.error} onRetry={() => resource.refetch().catch(() => { })} />
          ) : lanes.length === 0 ? (
            <EmptyState title="No lanes yet" description="Add your first lane to get started." />
          ) : (
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Origin</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead className="text-right">Base rate</TableHead>
                    <TableHead className="text-right">Distance</TableHead>
                    <TableHead className="text-right">Transit</TableHead>
                    <TableHead className="w-px text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lanes.map((lane) => (
                    <TableRow key={lane.id}>
                      <TableCell>{lane.origin_city}, {lane.origin_province}</TableCell>
                      <TableCell>{lane.destination_city}, {lane.destination_province}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(Number(lane.base_rate))}</TableCell>
                      <TableCell className="text-right tabular-nums">{Number(lane.distance_km).toLocaleString()} km</TableCell>
                      <TableCell className="text-right">{lane.transit_days}d</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(lane)} className="h-8 w-8">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(lane)}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? "Edit lane" : "Add lane"}>
        <form onSubmit={handleSave} className="flex flex-col gap-4">

          {/* Origin */}
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Origin</p>
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
                <Input id="origin_province" value={form.origin_province} readOnly
                  className="bg-muted text-muted-foreground" placeholder="Auto" />
              </Field>
            </div>
          </div>

          {/* Destination */}
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Destination</p>
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
                <Input id="destination_province" value={form.destination_province} readOnly
                  className="bg-muted text-muted-foreground" placeholder="Auto" />
              </Field>
            </div>
          </div>

          {/* Distance */}
          <Field
            label={distanceAuto ? "Distance (km) — auto-filled" : "Distance (km)"}
            htmlFor="distance_km"
            required
          >
            <Input
              id="distance_km"
              type="number"
              min="1"
              value={form.distance_km === 0 ? "" : form.distance_km}
              onChange={(e) => handleDistanceChange(Number(e.target.value))}
              placeholder="e.g. 541"
              required
              className={distanceAuto ? "border-green-500 bg-green-50 dark:bg-green-950/20" : ""}
            />
            {distanceAuto && (
              <p className="mt-1 text-xs text-green-600">
                ✓ Auto-filled from known route — you can edit it if needed.
              </p>
            )}
          </Field>

          {/* Transit days */}
          <Field label="Transit days" htmlFor="transit_days" required>
            <Input
              id="transit_days"
              type="number"
              min="1"
              value={form.transit_days || ""}
              onChange={(e) => setForm((f) => ({ ...f, transit_days: Number(e.target.value) }))}
              placeholder="1"
              required
            />
          </Field>

          {/* Rate calculation panel */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 flex flex-col gap-3">
            <p className="text-sm font-medium">Rate calculation</p>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Auto rate ({form.distance_km} km × ${RATE_PER_KM}/km)
              </span>
              <span className="tabular-nums font-medium">
                {formatCurrency(autoRate)}
              </span>
            </div>

            <Field label="Adjustment (optional)" htmlFor="adjustment">
              <Input
                id="adjustment"
                type="number"
                step="1"
                placeholder="e.g. 150 or -50"
                value={adjustment === 0 ? "" : adjustment}
                onChange={(e) => handleAdjustmentChange(Number(e.target.value) || 0)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Positive to increase (difficult route, low volume) · Negative to decrease (high volume, easy access)
              </p>
            </Field>

            {adjustment !== 0 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Adjustment</span>
                <span className={`tabular-nums ${adjustment > 0 ? "text-orange-600" : "text-green-600"}`}>
                  {adjustment > 0 ? "+" : ""}{formatCurrency(adjustment)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-border pt-3 text-sm font-semibold">
              <span>Final base rate (saved to DB)</span>
              <span className="tabular-nums text-primary">
                {formatCurrency(form.base_rate)}
              </span>
            </div>
          </div>

          {formError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </div>
          )}

          <div className="mt-2 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? "Save changes" : "Create lane"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}
        title="Delete lane?" description="This action cannot be undone."
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" loading={deleting} onClick={handleDelete}>Delete</Button>
          </>
        }>
        <p className="text-sm text-muted-foreground">Are you sure you want to delete this lane?</p>
      </Modal>
    </div>
  )
}
