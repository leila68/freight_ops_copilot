import { Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { AppLayout } from "@/components/AppLayout"
import { AuthPage } from "@/pages/AuthPage"
import { CustomerDashboard } from "@/pages/customer/CustomerDashboard"
import { StaffQuotes } from "@/pages/staff/StaffQuotes"
import { ManageLanes } from "@/pages/staff/ManageLanes"
import { ManageEquipment } from "@/pages/staff/ManageEquipment"
import { ManageAccessorials } from "@/pages/staff/ManageAccessorials"

// Sends already-authenticated users away from the login screen.
function LoginRoute() {
  const { isAuthenticated, user } = useAuth()
  if (isAuthenticated) {
    return <Navigate to={user?.role === "staff" ? "/staff" : "/customer"} replace />
  }
  return <AuthPage />
}

// Decides where "/" lands based on auth/role.
function RootRedirect() {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Navigate to={user?.role === "staff" ? "/staff" : "/customer"} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />

      {/* Customer */}
      <Route
        element={
          <ProtectedRoute role="customer">
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/customer" element={<CustomerDashboard />} />
      </Route>

      {/* Staff */}
      <Route
        element={
          <ProtectedRoute role="staff">
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/staff" element={<StaffQuotes />} />
        <Route path="/staff/lanes" element={<ManageLanes />} />
        <Route path="/staff/equipment" element={<ManageEquipment />} />
        <Route path="/staff/accessorials" element={<ManageAccessorials />} />
      </Route>

      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
