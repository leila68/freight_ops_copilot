import { NavLink, useNavigate } from "react-router-dom"
import { Truck, LogOut } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"

interface NavItem {
  to: string
  label: string
}

// Navigation differs by role.
const customerNav: NavItem[] = [{ to: "/customer", label: "Dashboard" }]

const staffNav: NavItem[] = [
  { to: "/staff", label: "Quotes" },
  { to: "/staff/lanes", label: "Lanes" },
  { to: "/staff/equipment", label: "Equipment" },
  { to: "/staff/accessorials", label: "Accessorials" },
]

export function AppHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const items = user?.role === "staff" ? staffNav : customerNav

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Truck className="h-4 w-4 text-primary-foreground" aria-hidden />
          </div>
          <span className="hidden text-sm font-semibold tracking-tight sm:inline">
            Freight Ops Copilot
          </span>
        </div>

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/staff" || item.to === "/customer"}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-tight">{user?.name}</p>
            <p className="text-xs capitalize text-muted-foreground">
              {user?.role}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
