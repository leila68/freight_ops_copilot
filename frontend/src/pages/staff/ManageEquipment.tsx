import { ResourceManager } from "@/components/ResourceManager"
import { equipmentApi } from "@/api/freight"
import type { Equipment } from "@/types"

type EquipmentForm = Omit<Equipment, "id">

const emptyForm: EquipmentForm = {
  name: "",
  multiplier: 1,
  description: "",
}

export function ManageEquipment() {
  return (
    <ResourceManager<Equipment, EquipmentForm>
      title="Equipment types"
      description="Manage equipment categories and their rate multipliers."
      singular="equipment type"
      list={equipmentApi.list}
      create={(p) => equipmentApi.create(p)}
      update={(id, p) => equipmentApi.update(id, p)}
      remove={(id) => equipmentApi.remove(id)}
      emptyForm={emptyForm}
      toForm={(e) => ({
        name: e.name,
        multiplier: e.multiplier,
        description: e.description ?? "",
      })}
      columns={[
        { header: "Name", render: (e) => e.name },
        { header: "Multiplier", align: "right", render: (e) => `${e.multiplier.toFixed(2)}x` },
        { header: "Description", render: (e) => e.description || "—" },
      ]}
      fields={[
        { key: "name", label: "Name", placeholder: "Reefer (refrigerated)", required: true },
        {
          key: "multiplier",
          label: "Rate multiplier",
          type: "number",
          step: "0.01",
          placeholder: "1.25",
          required: true,
        },
        { key: "description", label: "Description", placeholder: "Temperature-controlled trailer", textarea: true },
      ]}
    />
  )
}
