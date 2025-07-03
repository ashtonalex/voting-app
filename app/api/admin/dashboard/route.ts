import { NextRequest, NextResponse } from "next/server";
import { getDashboardData } from "@/lib/dashboard-queries";
import { getCachedDashboardData } from "@/lib/dashboard-cache";
import { getQueryCount, resetQueryCount } from "@/lib/query-monitor";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    resetQueryCount();
    const data = await getCachedDashboardData(getDashboardData);
    const queryCount = getQueryCount();
    return NextResponse.json({
      ...data,
      queryCount,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
