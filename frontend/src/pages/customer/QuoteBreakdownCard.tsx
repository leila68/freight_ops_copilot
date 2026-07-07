import { CheckCircle2, Loader2, AlertCircle, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { formatCurrency } from "@/lib/format"
import type { LiveQuoteState } from "./CustomerDashboard"

function Row({
  label, value, sub, emphasize,
}: {
  label: string; value: string; sub?: string; emphasize?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div>
        <p className={emphasize ? "text-sm font-semibold" : "text-sm text-foreground"}>{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
      <p className={emphasize ? "text-base font-semibold tabular-nums" : "text-sm tabular-nums"}>
        {value}
      </p>
    </div>
  )
}

export function QuoteBreakdownCard({
  liveState,
  onBook,
  onNewQuote,
}: {
  liveState: LiveQuoteState
  onBook: () => void
  onNewQuote: () => void
}) {
  // Idle — form not complete yet
  if (liveState.status === "idle") {
    return (
      <Card className="h-full">
        <CardContent className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
            <FileText className="h-5 w-5 text-muted-foreground" aria-hidden />
          </div>
          <p className="text-sm font-medium">Quote preview</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Fill in all shipment details on the left to see an instant price breakdown here.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Calculating — spinner
  if (liveState.status === "calculating") {
    return (
      <Card className="h-full">
        <CardContent className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 text-center">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Calculating rate...</p>
        </CardContent>
      </Card>
    )
  }

  // Error — lane not found or other API error
  if (liveState.status === "error") {
    return (
      <Card className="h-full">
        <CardContent className="flex h-full min-h-[300px] flex-col items-center justify-center gap-4 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-sm font-medium text-destructive">No rate available</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">{liveState.message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Booked — success
  if (liveState.status === "booked") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <div>
            <p className="text-base font-semibold">Quote booked!</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your quote for {formatCurrency(Number(liveState.breakdown.total))} has been
              submitted. You can track it in your quote history tab.
            </p>
          </div>
          <Button variant="outline" onClick={onNewQuote} className="mt-2">
            Get another quote
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Ready or booking — show full breakdown
  const breakdown = liveState.status === "ready" || liveState.status === "booking"
    ? liveState.breakdown ?? (liveState as { breakdown: typeof liveState extends { breakdown: infer B } ? B : never }).breakdown
    : null

  // Extract breakdown safely for both ready and booking states
  const bd = liveState.status === "ready"
    ? liveState.breakdown
    : (liveState as { status: "booking"; breakdown?: typeof liveState extends { breakdown: infer B } ? B : never }).breakdown

  if (!bd) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price breakdown</CardTitle>
        <p className="text-xs text-muted-foreground">
          Live preview — updates as you change details.
        </p>
      </CardHeader>

      <CardContent className="divide-y divide-border py-2">
        <Row label="Base rate" value={formatCurrency(Number(bd.base_rate))} />
        <Row
          label="Equipment adjustment"
          sub={`Multiplier ×${bd.equipment_multiplier}`}
          value={`${Number(bd.equipment_adjustment) >= 0 ? "+" : ""}${formatCurrency(Number(bd.equipment_adjustment))}`}
        />
        <Row
          label="Weight factor"
          sub={`Factor ×${bd.weight_factor}`}
          value={`${Number(bd.weight_adjustment) >= 0 ? "+" : ""}${formatCurrency(Number(bd.weight_adjustment))}`}
        />
        <Row label="Fuel surcharge" sub={`${bd.fuel_surcharge_percent}% applied`} value={`+${formatCurrency(Number(bd.fuel_surcharge))}`} />

        {bd.accessorials.length > 0 && (
          <div className="py-2.5">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Accessorials
            </p>
            <div className="flex flex-col">
              {bd.accessorials.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-1 text-sm">
                  <span>{a.name}</span>
                  <span className="tabular-nums">+{formatCurrency(Number(a.fee))}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Row label="Total" value={formatCurrency(Number(bd.total))} emphasize />
      </CardContent>

      <CardFooter className="flex flex-col gap-2 border-t border-border pt-4">
        <Button
          className="w-full"
          onClick={onBook}
          loading={liveState.status === "booking"}
          disabled={liveState.status === "booking"}
        >
          Confirm & Book
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          By confirming, this quote will be saved and sent to our team.
        </p>
      </CardFooter>
    </Card>
  )
}