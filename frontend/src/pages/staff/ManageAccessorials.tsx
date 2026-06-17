import { ResourceManager } from "@/components/ResourceManager"
import { accessorialApi } from "@/api/freight"
import { formatCurrency } from "@/lib/format"
import type { Accessorial } from "@/types"

type AccessorialForm = Omit<Accessorial, "id">

const emptyForm: AccessorialForm = {
  name: "",
  charge_type: "flat",
  amount: 0,
  description: "",
}

export function ManageAccessorials() {
  return (
    <ResourceManager<Accessorial, AccessorialForm>
      title="Accessorials"
      description="Manage optional service charges customers can add to a quote."
      singular="accessorial"
      list={accessorialApi.list}
      create={(p) => accessorialApi.create(p)}
      update={(id, p) => accessorialApi.update(id, p)}
      remove={(id) => accessorialApi.remove(id)}
      emptyForm={emptyForm}
      toForm={(a) => ({
        name: a.name,
        charge_type: a.charge_type,
        amount: a.amount,
        description: a.description ?? "",
      })}
      columns={[
        { header: "Name", render: (a) => a.name },
        {
          header: "Type",
          render: (a) => (a.charge_type === "flat" ? "Flat fee" : "Percent"),
        },
        {
          header: "Amount",
          align: "right",
          render: (a) => (a.charge_type === "flat" ? formatCurrency(a.amount) : `${a.amount}%`),
        },
        { header: "Description", render: (a) => a.description || "—" },
      ]}
      fields={[
        { key: "name", label: "Name", placeholder: "Liftgate service", required: true },
        {
          key: "charge_type",
          label: "Charge type",
          type: "select",
          options: [
            { label: "Flat fee (USD)", value: "flat" },
            { label: "Percent of base (%)", value: "percent" },
          ],
          required: true,
        },
        { key: "amount", label: "Amount", type: "number", step: "0.01", placeholder: "75", required: true },
        { key: "description", label: "Description", placeholder: "Hydraulic liftgate for ground-level delivery", textarea: true },
      ]}
    />
  )
}
