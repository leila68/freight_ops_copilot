import { ResourceManager } from "@/components/ResourceManager"
import { laneApi } from "@/api/freight"
import { formatCurrency, formatNumber } from "@/lib/format"
import type { Lane } from "@/types"

type LaneForm = Omit<Lane, "id">

const emptyForm: LaneForm = {
  origin: "",
  destination: "",
  base_rate: 0,
  distance: 0,
}

export function ManageLanes() {
  return (
    <ResourceManager<Lane, LaneForm>
      title="Lanes"
      description="Manage origin–destination lanes and their base rates."
      singular="lane"
      list={laneApi.list}
      create={(p) => laneApi.create(p)}
      update={(id, p) => laneApi.update(id, p)}
      remove={(id) => laneApi.remove(id)}
      emptyForm={emptyForm}
      toForm={(l) => ({
        origin: l.origin,
        destination: l.destination,
        base_rate: l.base_rate,
        distance: l.distance,
      })}
      columns={[
        { header: "Origin", render: (l) => l.origin },
        { header: "Destination", render: (l) => l.destination },
        {
          header: "Base rate",
          align: "right",
          render: (l) => formatCurrency(l.base_rate),
        },
        {
          header: "Distance",
          align: "right",
          render: (l) => `${formatNumber(l.distance)} mi`,
        },
      ]}
      fields={[
        { key: "origin", label: "Origin (City, PROV)", placeholder: "Toronto, ON", required: true },
        { key: "destination", label: "Destination (City, PROV)", placeholder: "Montreal, QC", required: true },
        { key: "base_rate", label: "Base rate (USD)", type: "number", placeholder: "1200", required: true },
        { key: "distance", label: "Distance (miles)", type: "number", placeholder: "335", required: true },
      ]}
    />
  )
}
