import { useState, useEffect, useRef } from "react"
import { PageHeader } from "@/components/PageHeader"
import { QuoteForm } from "./QuoteForm"
import { QuoteBreakdownCard } from "./QuoteBreakdownCard"
import { useAsync } from "@/hooks/useAsync"
import { quoteApi } from "@/api/freight"
import { getErrorMessage } from "@/api/client"
import type { QuoteBreakdown, QuoteCalculateRequest } from "@/types"

export type LiveQuoteState =
  | { status: "idle" }
  | { status: "calculating" }
  | { status: "ready"; breakdown: QuoteBreakdown; payload: QuoteCalculateRequest }
  | { status: "error"; message: string }
  | { status: "booking"; breakdown: QuoteBreakdown }
  | { status: "booked"; breakdown: QuoteBreakdown }

export function CustomerDashboard() {
  const history = useAsync(() => quoteApi.list(), [])
  const [liveState, setLiveState] = useState<LiveQuoteState>({ status: "idle" })

  // Use a ref to debounce auto-calculate calls
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Called by QuoteForm whenever any field changes
  const handleFormChange = (payload: QuoteCalculateRequest | null) => {
    // null means form is incomplete
    if (!payload) {
      setLiveState({ status: "idle" })
      if (debounceRef.current) clearTimeout(debounceRef.current)
      return
    }

    setLiveState({ status: "calculating" })
    if (debounceRef.current) clearTimeout(debounceRef.current)

    // Debounce 400ms so we don't spam the API on every keystroke
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await quoteApi.preview(payload)
        setLiveState({ status: "ready", breakdown: result, payload })
      } catch (err) {
        setLiveState({ status: "error", message: getErrorMessage(err) })
      }
    }, 400)
  }

  // Book — save to DB after customer confirms
  const handleBook = async () => {
    if (liveState.status !== "ready") return
    const { breakdown, payload } = liveState
    setLiveState({ status: "booking", breakdown })  // pass breakdown here
    try {
      await quoteApi.book(payload)
      setLiveState({ status: "booked", breakdown })
      history.refetch().catch(() => { })
    } catch (err) {
      setLiveState({ status: "error", message: getErrorMessage(err) })
    }
  }

  const handleNewQuote = () => {
    setLiveState({ status: "idle" })
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <div>
      <PageHeader
        title="Get a quote"
        description="Fill in your shipment details to see an instant rate."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <QuoteForm
            onChange={handleFormChange}
            locked={liveState.status === "booking" || liveState.status === "booked"}
            onReset={handleNewQuote}
          />
        </div>
        <div className="lg:col-span-2">
          <QuoteBreakdownCard
            liveState={liveState}
            onBook={handleBook}
            onNewQuote={handleNewQuote}
          />
        </div>
      </div>

    </div>
  )
}