import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { formatCurrency } from "@/lib/format"
import type { QuoteBreakdown } from "@/types"

function Row({
  label,
  value,
  sub,
  emphasize,
}: {
  label: string
  value: string
  sub?: string
  emphasize?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div>
        <p
          className={
            emphasize
              ? "text-sm font-semibold text-foreground"
              : "text-sm text-foreground"
          }
        >
          {label}
        </p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
      <p
        className={
          emphasize
            ? "text-base font-semibold tabular-nums"
            : "text-sm tabular-nums text-foreground"
        }
      >
        {value}
      </p>
    </div>
  )
}

export function QuoteBreakdownCard({
  breakdown,
}: {
  breakdown: QuoteBreakdown
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Price breakdown</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border py-2">
        <Row label="Base rate" value={formatCurrency(breakdown.base_rate)} />
        <Row
          label="Equipment adjustment"
          sub={`Multiplier ×${breakdown.equipment_multiplier}`}
          value={`${breakdown.equipment_adjustment >= 0 ? "+" : ""}${formatCurrency(
            breakdown.equipment_adjustment,
          )}`}
        />
        <Row
          label="Weight factor"
          sub={`Factor ×${breakdown.weight_factor}`}
          value={`${breakdown.weight_adjustment >= 0 ? "+" : ""}${formatCurrency(
            breakdown.weight_adjustment,
          )}`}
        />
        <Row
          label="Fuel surcharge"
          value={`+${formatCurrency(breakdown.fuel_surcharge)}`}
        />

        {breakdown.accessorials.length > 0 && (
          <div className="py-2.5">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Accessorials
            </p>
            <div className="flex flex-col">
              {breakdown.accessorials.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between py-1 text-sm"
                >
                  <span className="text-foreground">{a.name}</span>
                  <span className="tabular-nums text-foreground">
                    +{formatCurrency(a.fee)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Row
          label="Total"
          value={formatCurrency(breakdown.total)}
          emphasize
        />
      </CardContent>
    </Card>
  )
}
