import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Voting System</h1>
        <p className="text-xl text-gray-600 mb-8">Secure voting platform for team competitions</p>
        <div className="space-x-4">
          <Button asChild>
            <Link href="/admin">Admin Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
