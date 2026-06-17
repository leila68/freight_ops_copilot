import { forwardRef } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string
}

// Accessible checkbox with a styled box layered over a native input.
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, checked, ...props }, ref) => {
    return (
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <span className="relative inline-flex h-4 w-4 items-center justify-center">
          <input
            ref={ref}
            type="checkbox"
            checked={checked}
            className="peer absolute inset-0 cursor-pointer appearance-none rounded border border-input bg-card checked:border-primary checked:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...props}
          />
          <Check
            className={cn(
              "pointer-events-none h-3 w-3 text-primary-foreground opacity-0 peer-checked:opacity-100",
              className,
            )}
            aria-hidden
          />
        </span>
        {label && <span className="text-foreground">{label}</span>}
      </label>
    )
  },
)
Checkbox.displayName = "Checkbox"
