import { unstable_cache } from "next/cache";
import { revalidateTag } from "next/cache";

const DASHBOARD_TAG = "dashboard";

export function getDashboardCacheKey() {
  return DASHBOARD_TAG;
}

export const getCachedDashboardData = unstable_cache(
  async (getDashboardData: () => Promise<any>) => getDashboardData(),
  [DASHBOARD_TAG],
  {
    revalidate: 60, // Reduced to 1 minute for more frequent updates
    tags: [DASHBOARD_TAG],
  }
);

export async function revalidateDashboardTag() {
  "use server";
  try {
    await revalidateTag(DASHBOARD_TAG);
    console.log(`Dashboard cache invalidated: ${DASHBOARD_TAG}`);
  } catch (error) {
    console.error("Failed to revalidate dashboard cache:", error);
  }
}

// Additional helper function to clear cache completely
export async function clearDashboardCache() {
  "use server";
  try {
    await revalidateTag(DASHBOARD_TAG);
    console.log("Dashboard cache cleared");
  } catch (error) {
    console.error("Failed to clear dashboard cache:", error);
  }
}