import { useNavigate } from "react-router-dom"
import { Truck, LogOut } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/Button"


interface NavItem {
  to: string
  label: string
}

// Navigation differs by role.


export function AppHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-8xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Truck className="h-4 w-4 text-primary-foreground" aria-hidden />
          </div>
          <span className="hidden text-sm font-semibold tracking-tight sm:inline">
            Freight Ops Copilot
          </span>
        </div>


        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-tight">{user?.full_name}</p>
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
