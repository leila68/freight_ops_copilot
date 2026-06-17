import { useMemo, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { StatusBadge } from "@/components/ui/Badge"
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States"
import { formatCurrency, formatDate } from "@/lib/format"
import type { Quote, QuoteStatus } from "@/types"

interface QuoteTableProps {
  quotes: Quote[]
  loading: boolean
  error: string | null
  onRetry: () => void
  // Staff view shows the customer column and a customer filter.
  showCustomer?: boolean
}

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "expired", label: "Expired" },
  { value: "rejected", label: "Rejected" },
]

// Client-side filtering over the fetched quotes. The backend also accepts
// filters as query params (see quoteApi.list) — this provides instant UX on
// top of already-loaded data.
export function QuoteTable({
  quotes,
  loading,
  error,
  onRetry,
  showCustomer,
}: QuoteTableProps) {
  const [status, setStatus] = useState<QuoteStatus | "all">("all")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    return quotes.filter((q) => {
      if (status !== "all" && q.status !== status) return false
      if (from && new Date(q.created_at) < new Date(from)) return false
      if (to && new Date(q.created_at) > new Date(`${to}T23:59:59`)) return false
      if (search) {
        const haystack = `${q.origin} ${q.destination} ${q.customer_name ?? ""}`.toLowerCase()
        if (!haystack.includes(search.toLowerCase())) return false
      }
      return true
    })
  }, [quotes, status, from, to, search])

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          placeholder={showCustomer ? "Search lane or customer" : "Search lane"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search quotes"
        />
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as QuoteStatus | "all")}
          options={statusOptions}
          aria-label="Filter by status"
        />
        <Input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          aria-label="From date"
        />
        <Input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          aria-label="To date"
        />
      </div>

      {loading ? (
        <LoadingState label="Loading quotes..." />
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No quotes found"
          description="Adjust your filters or create a new quote."
        />
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                {showCustomer && <TableHead>Customer</TableHead>}
                <TableHead>Lane</TableHead>
                <TableHead>Equipment</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDate(q.created_at)}
                  </TableCell>
                  {showCustomer && (
                    <TableCell className="font-medium">
                      {q.customer_name ?? "—"}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <span>{q.origin}</span>
                      <span className="text-muted-foreground">→</span>
                      <span>{q.destination}</span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {q.equipment_type}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(q.total_price)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={q.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
