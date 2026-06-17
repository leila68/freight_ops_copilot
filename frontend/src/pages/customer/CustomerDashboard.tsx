import { useState } from "react"
import { PageHeader } from "@/components/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { QuoteForm } from "./QuoteForm"
import { QuoteBreakdownCard } from "./QuoteBreakdownCard"
import { QuoteTable } from "@/components/QuoteTable"
import { ErrorState } from "@/components/ui/States"
import { useAsync } from "@/hooks/useAsync"
import { quoteApi } from "@/api/freight"
import { getErrorMessage } from "@/api/client"
import { FileText } from "lucide-react"
import type { QuoteBreakdown, QuoteCalculateRequest } from "@/types"

export function CustomerDashboard() {
  // Quote history for the logged-in customer. The backend scopes /quotes to
  // the authenticated user's own quotes for customer tokens.
  const history = useAsync(() => quoteApi.list(), [])

  const [breakdown, setBreakdown] = useState<QuoteBreakdown | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [calcError, setCalcError] = useState<string | null>(null)

  const handleCalculate = async (payload: QuoteCalculateRequest) => {
    setCalcError(null)
    setCalculating(true)
    setBreakdown(null)
    try {
      const result = await quoteApi.calculate(payload)
      setBreakdown(result)
      // Refresh history in case the backend persisted the calculated quote.
      history.refetch().catch(() => {})
    } catch (err) {
      setCalcError(getErrorMessage(err))
    } finally {
      setCalculating(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Customer dashboard"
        description="Request freight quotes and review your quote history."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <QuoteForm onSubmit={handleCalculate} submitting={calculating} />
        </div>
        <div className="lg:col-span-2">
          {calcError ? (
            <Card>
              <CardContent>
                <ErrorState message={calcError} />
              </CardContent>
            </Card>
          ) : breakdown ? (
            <QuoteBreakdownCard breakdown={breakdown} />
          ) : (
            <Card className="h-full">
              <CardContent className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" aria-hidden />
                </div>
                <p className="text-sm font-medium">No quote yet</p>
                <p className="max-w-xs text-sm text-muted-foreground">
                  Fill in the shipment details and calculate a quote to see the
                  full price breakdown here.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Quote history</CardTitle>
        </CardHeader>
        <CardContent>
          <QuoteTable
            quotes={history.data ?? []}
            loading={history.loading}
            error={history.error}
            onRetry={() => history.refetch().catch(() => {})}
          />
        </CardContent>
      </Card>
    </div>
  )
}
