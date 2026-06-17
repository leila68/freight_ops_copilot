import { Outlet } from "react-router-dom"
import { AppHeader } from "./AppHeader"
import { CopilotPanel } from "./copilot/CopilotPanel"

// Shared shell for authenticated pages: header nav + page content + the
// floating AI Copilot available on every dashboard.
export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
      <CopilotPanel />
    </div>
  )
}
