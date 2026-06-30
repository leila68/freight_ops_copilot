import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Truck } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { getErrorMessage } from "@/api/client"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Field } from "@/components/ui/Field"
import { Card, CardContent } from "@/components/ui/Card"
import type { UserRole } from "@/types"

type Mode = "login" | "signup"

// ASSUMPTION: Customers can self-signup and choose their role here for demo
// purposes. In production, staff accounts would typically be provisioned by an
// admin and signup would be customer-only. To enforce that, remove the role
// selector below and hardcode role: "customer" in the signup payload.
export function AuthPage() {
  const navigate = useNavigate()
  const { login, signup } = useAuth()

  const [mode, setMode] = useState<Mode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [role, setRole] = useState<UserRole>("customer")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const user =
        mode === "login"
          ? await login({ email, password })
          : await signup({ email, password, full_name: name, role, company_name: company })
      // Route by role.
      navigate(user.role === "staff" ? "/staff" : "/customer", {
        replace: true,
      })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Truck className="h-6 w-6 text-primary-foreground" aria-hidden />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Freight Ops Copilot
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Smart freight quoting for shippers and operators
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={
                  mode === "login"
                    ? "rounded-md bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm"
                    : "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                }
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={
                  mode === "signup"
                    ? "rounded-md bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm"
                    : "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                }
              >
                Create account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {mode === "signup" && (
                <Field label="Full name" htmlFor="name" required>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jordan Rivera"
                    required
                    autoComplete="name"
                  />
                </Field>
              )}

              <Field label="Email" htmlFor="email" required>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                />
              </Field>

              <Field label="Password" htmlFor="password" required>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                />
              </Field>

              {mode === "signup" && (
                <>
                  <Field label="Company" htmlFor="company">
                    <Input
                      id="company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Acme Shipping Co."
                      autoComplete="organization"
                    />
                  </Field>
                  {/* <Field label="Account type" htmlFor="role">
                    <Select
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      options={[
                        { value: "customer", label: "Customer (Shipper)" },
                        { value: "staff", label: "Staff (Freight operator)" },
                      ]}
                    />
                  </Field> */}
                </>
              )}

              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" loading={loading} className="mt-2 w-full">
                {mode === "login" ? "Sign in" : "Create account"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {/* TODO: wire to real backend at VITE_API_URL */}
          Connects to the Freight Ops API. Configure VITE_API_URL to point at
          your backend.
        </p>
      </div>
    </main>
  )
}
