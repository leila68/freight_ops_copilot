import { useState } from "react"
import { PageHeader } from "@/components/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { QuoteTable } from "@/components/QuoteTable"
import { useAsync } from "@/hooks/useAsync"
import { quoteApi } from "@/api/freight"


export function CustomerQuoteHistory() {
  // Quote history for the logged-in customer. 

  const history = useAsync(() => quoteApi.list(), [])


  return (
    <div>
      <PageHeader
        title="Quote History"
        description=" Review your quote history."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        
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
