import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Monthly Budget</h3>
                <p className="text-gray-600">Configure your monthly budget limits and track expenses.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Analytics</h3>
                <p className="text-gray-600">View detailed analytics and spending patterns.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Reports</h3>
                <p className="text-gray-600">Generate comprehensive financial reports.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
