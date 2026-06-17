import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import type { QuoteStatus } from "@/types"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        neutral: "bg-muted text-muted-foreground",
        primary: "bg-primary/10 text-primary",
        success: "bg-success/15 text-success",
        warning: "bg-warning/20 text-warning-foreground",
        destructive: "bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, className }))} {...props} />
  )
}

const statusVariant: Record<QuoteStatus, BadgeProps["variant"]> = {
  pending: "warning",
  accepted: "success",
  expired: "neutral",
  rejected: "destructive",
}

export function StatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <Badge variant={statusVariant[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}
