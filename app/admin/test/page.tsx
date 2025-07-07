"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function AdminTestPage() {
  const { data: session, status } = useSession();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [votesData, setVotesData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      setError("No session found");
      setLoading(false);
      return;
    }

    const testAPIs = async () => {
      try {
        setLoading(true);
        setError(null);

        // Test dashboard API
        const dashboardResponse = await fetch("/api/admin/dashboard", {
          credentials: "include",
        });
        const dashboardResult = await dashboardResponse.json();

        if (dashboardResponse.ok) {
          setDashboardData(dashboardResult);
        } else {
          throw new Error(`Dashboard API failed: ${dashboardResult.error}`);
        }

        // Test votes API
        const votesResponse = await fetch("/api/admin/votes", {
          credentials: "include",
        });
        const votesResult = await votesResponse.json();

        if (votesResponse.ok) {
          setVotesData(votesResult);
        } else {
          throw new Error(`Votes API failed: ${votesResult.error}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    testAPIs();
  }, [session, status]);

  if (status === "loading" || loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Admin API Test</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin API Test</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-2">Dashboard API</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(dashboardData, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Votes API</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(votesData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
