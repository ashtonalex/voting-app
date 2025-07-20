import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface DashboardRefreshButtonProps {
  onRefresh: (data?: any) => void;
}

export const DashboardRefreshButton: React.FC<DashboardRefreshButtonProps> = ({
  onRefresh,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/dashboard?fresh=true");
      if (!res.ok) {
        throw new Error("Failed to fetch fresh dashboard data");
      }
      const data = await res.json();
      onRefresh(data);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="secondary"
        onClick={handleRefresh}
        disabled={loading}
        className="flex items-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-800 focus-visible:ring-blue-500"
      >
        <RefreshCw className={loading ? "animate-spin" : ""} />
        {loading ? "Refreshing..." : "Refresh"}
      </Button>
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
    </div>
  );
};

export default DashboardRefreshButton;
