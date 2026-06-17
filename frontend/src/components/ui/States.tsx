import { Loader2, AlertCircle, Inbox } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./Button"

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("h-5 w-5 animate-spin text-muted-foreground", className)}
      aria-hidden
    />
  )
}

// Centered loading state for cards / tables / panels.
export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-12 text-sm text-muted-foreground"
      role="status"
    >
      <Spinner />
      <span>{label}</span>
    </div>
  )
}

// Error state with optional retry action.
export function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <AlertCircle className="h-6 w-6 text-destructive" aria-hidden />
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

// Empty state for tables / lists with no data.
export function EmptyState({
  title = "Nothing here yet",
  description,
}: {
  title?: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <Inbox className="h-6 w-6 text-muted-foreground" aria-hidden />
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
