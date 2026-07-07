import { PageHeader } from "@/components/PageHeader"
import { Card, CardContent } from "@/components/ui/Card"

export function StaffDashboard() {
  // mock analytics data
  const stats = [
    { label: "Total Quotes", value: 1284, change: "+12%" },
    { label: "Pending Review", value: 42, change: "+5%" },
    { label: "Approved Today", value: 18, change: "+3%" },
    { label: "Avg Response Time", value: "1.8h", change: "-10%" },
  ]

  const activities = [
    { user: "Sarah K.", action: "created a new quote", time: "5 min ago" },
    { user: "John M.", action: "approved quote #Q-1029", time: "20 min ago" },
    { user: "System", action: "auto-assigned lane optimization", time: "1h ago" },
    { user: "Emily R.", action: "updated equipment pricing", time: "2h ago" },
    { user: "Daniel T.", action: "rejected quote #Q-998", time: "3h ago" },
  ]

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        description="Overview of system activity and quote performance"
      />

      {/* STATS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-lg border bg-card p-4 shadow-sm"
          >
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-semibold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.change} vs last week</p>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Activity feed */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent>
              <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>

              <div className="space-y-3">
                {activities.map((a, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between border-b pb-2 last:border-none"
                  >
                    <div>
                      <p className="text-sm font-medium">{a.user}</p>
                      <p className="text-sm text-muted-foreground">
                        {a.action}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {a.time}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick summary panel */}
        <div>
          <Card>
            <CardContent>
              <h2 className="text-lg font-semibold mb-4">System Health</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>API Status</span>
                  <span className="text-green-600 font-medium">Healthy</span>
                </div>

                <div className="flex justify-between">
                  <span>Database Load</span>
                  <span>62%</span>
                </div>

                <div className="flex justify-between">
                  <span>Active Users</span>
                  <span>38</span>
                </div>

                <div className="flex justify-between">
                  <span>Queue Backlog</span>
                  <span className="text-yellow-600">Moderate</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}