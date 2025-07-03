import { getQueryStats, getQueryHistory } from "./prisma";
import type { QueryStats, QueryLog } from "@/types/query-tracking";

export function getCurrentQueryStats(): QueryStats {
  return getQueryStats();
}

export function getRecentQueries(limit = 20): QueryLog[] {
  return getQueryHistory().slice(-limit).reverse();
}

export function getPeakUsageTimes(): Array<{ time: Date; count: number }> {
  return getQueryStats().peakUsageTimes;
}

export function getQueryEfficiencyMetrics() {
  const stats = getQueryStats();
  return {
    averageDuration: stats.averageDuration,
    queriesPerEndpoint: stats.byEndpoint,
    queriesPerSession: stats.bySessions,
  };
}
