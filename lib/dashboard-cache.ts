import { unstable_cache } from "next/cache";

const DASHBOARD_TAG = "dashboard";

export function getDashboardCacheKey() {
  return DASHBOARD_TAG;
}

export const getCachedDashboardData = unstable_cache(
  async (getDashboardData: () => Promise<any>) => getDashboardData(),
  [DASHBOARD_TAG],
  {
    revalidate: 300, // 5 minutes
    tags: [DASHBOARD_TAG],
  }
);

export async function revalidateDashboardTag() {
  "use server";
  // @ts-ignore
  if (typeof globalThis.revalidateTag === "function") {
    // Next.js 13/14+ API
    // @ts-ignore
    await globalThis.revalidateTag(DASHBOARD_TAG);
  }
}
