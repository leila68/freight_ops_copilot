import { PageHeader } from "@/components/PageHeader"
import { Card, CardContent } from "@/components/ui/Card"
import { QuoteTable } from "@/components/QuoteTable"
import { useAsync } from "@/hooks/useAsync"
import { quoteApi } from "@/api/freight"

export function StaffQuotes() {
  // Staff token returns all quotes across customers.
  const quotes = useAsync(() => quoteApi.list(), [])

  return (
    <div>
      <PageHeader
        title="All quotes"
        description="Review and filter quotes across every customer and lane."
      />
      <Card>
        <CardContent>
          <QuoteTable
            quotes={quotes.data ?? []}
            loading={quotes.loading}
            error={quotes.error}
            onRetry={() => quotes.refetch().catch(() => {})}
            showCustomer
          />
        </CardContent>
      </Card>
    </div>
  )
}
