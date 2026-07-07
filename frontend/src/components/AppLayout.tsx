import { Outlet } from "react-router-dom"
import { AppHeader } from "./AppHeader"
import { AppSidebar } from "./AppSidebar"
import { CopilotPanel } from "./copilot/CopilotPanel"

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <div className="mx-auto flex max-w-8xl">
        <AppSidebar />

        <main className="w-full px-10 py-8">
          <Outlet />
        </main>
      </div>

      <CopilotPanel />
    </div>
  )
}