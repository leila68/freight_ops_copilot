import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import type { UserRole } from "@/types"

// Guards routes by authentication and (optionally) role.
export function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactNode
  role?: UserRole
}) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // Redirect users to their own dashboard if they hit the wrong role's route.
  if (role && user?.role !== role) {
    return <Navigate to={user?.role === "staff" ? "/staff" : "/customer"} replace />
  }

  return <>{children}</>
}
