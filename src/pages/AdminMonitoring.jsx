import DashboardLayout from '../components/DashboardLayout'

export default function AdminMonitoring() {
  return (
    <DashboardLayout title="Monitoring">
      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium">System Health</h3>
            <p className="text-sm text-gray-500 mt-2">CPU, memory, and uptime metrics (placeholder).</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium">Recent Logs</h3>
            <p className="text-sm text-gray-500 mt-2">Activity logs and function errors will appear here.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
