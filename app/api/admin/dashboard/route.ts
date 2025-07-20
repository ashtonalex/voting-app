import { NextRequest, NextResponse } from "next/server";
import { getDashboardData } from "@/lib/dashboard-queries";
import { getCachedDashboardData } from "@/lib/dashboard-cache";
import { getQueryCount, resetQueryCount } from "@/lib/query-monitor";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    resetQueryCount();
    const { searchParams } = new URL(request.url);
    const fresh = searchParams.get("fresh") === "true";
    let data, fromCache;
    if (fresh) {
      data = await getDashboardData();
      fromCache = false;
    } else {
      data = await getCachedDashboardData(getDashboardData);
      fromCache = true;
    }
    const queryCount = getQueryCount();
    return NextResponse.json({
      ...data,
      queryCount,
      timestamp: new Date().toISOString(),
      fromCache,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
