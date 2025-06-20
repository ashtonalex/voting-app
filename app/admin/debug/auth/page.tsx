"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function AuthDebugPage() {
  const [password, setPassword] = useState("admin123")
  const [result, setResult] = useState<any>(null)

  const testAuth = async () => {
    try {
      const response = await fetch("/api/debug/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error("Debug test error:", error)
      setResult({ error: error instanceof Error ? error.message : "Unknown error" })
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Auth Debug Page</h1>
      
      <div className="space-y-4 mb-8">
        <div className="flex gap-4">
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
          <Button onClick={testAuth}>Test Auth</Button>
        </div>
      </div>

      {result && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Debug Results:</h2>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-[600px]">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
} 