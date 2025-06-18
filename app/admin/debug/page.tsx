"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Info } from "lucide-react"

export default function DebugPage() {
  const [testResult, setTestResult] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testPasswordHash = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/debug/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: "admin123" }),
      })

      const result = await response.json()
      setTestResult(JSON.stringify(result, null, 2))
    } catch (error) {
      setTestResult(`Error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Debug Page</h1>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Environment Check</CardTitle>
              <CardDescription>Check if required environment variables are set</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                {process.env.NEXT_PUBLIC_VERCEL_ENV ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Info className="h-4 w-4 text-blue-600" />
                )}
                <span>Environment: {process.env.NODE_ENV}</span>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Default Admin Password:</strong> admin123
                  <br />
                  <strong>Admin Login URL:</strong> /admin/login
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Password Hash Test</CardTitle>
              <CardDescription>Test if the password hash is working correctly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={testPasswordHash} disabled={isLoading}>
                {isLoading ? "Testing..." : "Test Password Hash"}
              </Button>

              {testResult && (
                <div className="mt-4">
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">{testResult}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
