import { NavLink } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

interface NavItem {
  to: string
  label: string
}

const customerNav: NavItem[] = [
  { to: "/customer", label: "Dashboard" },
  { to: "/customer/quotehistory", label: "Quote History" },
]

const staffNav: NavItem[] = [
  { to: "/staff", label: "Dashboard" },
  { to: "/staff/staffquote", label: "Quotes" },
  { to: "/staff/lanes", label: "Lanes" },
  { to: "/staff/equipment", label: "Equipment" },
  { to: "/staff/accessorials", label: "Accessorials" },
  { to: "/staff/documents", label: "Documents" },
  { to: "/staff/setting", label: "Setting" },
]

export function AppSidebar() {
  const { user } = useAuth()
  const items = user?.role === "staff" ? staffNav : customerNav

  return (
    <aside className="w-80 border-r border-border p-4">
      <nav className="flex flex-col gap-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/customer" || item.to === "/staff"}
            className={({ isActive }) =>
              cn(
                "rounded-md px-3 py-2 text-sm font-medium",
                isActive
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}