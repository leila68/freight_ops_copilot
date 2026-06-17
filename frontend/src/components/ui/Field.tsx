import { cn } from "@/lib/utils"

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-sm font-medium text-foreground leading-none",
        className,
      )}
      {...props}
    />
  )
}

export interface FieldProps {
  label: string
  htmlFor?: string
  error?: string
  required?: boolean
  className?: string
  children: React.ReactNode
}

// A labeled form field wrapper with optional inline error text.
export function Field({
  label,
  htmlFor,
  error,
  required,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
