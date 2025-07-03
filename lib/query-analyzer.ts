import { prisma, getQueryHistory } from "./prisma";
import type { QueryLog } from "@/types/query-tracking";

export async function analyzeVoteQueries(
  submitVote: () => Promise<any>
): Promise<{ count: number; queries: QueryLog[] }> {
  const before = getQueryHistory().length;
  await submitVote();
  const after = getQueryHistory().length;
  const queries = getQueryHistory().slice(-1 * (after - before));
  return { count: after - before, queries };
}

export async function analyzeDashboardQueries(
  loadDashboard: () => Promise<any>
): Promise<{ count: number; queries: QueryLog[] }> {
  const before = getQueryHistory().length;
  await loadDashboard();
  const after = getQueryHistory().length;
  const queries = getQueryHistory().slice(-1 * (after - before));
  return { count: after - before, queries };
}

export async function benchmarkOperation(
  fn: () => Promise<any>,
  iterations = 5
) {
  let totalQueries = 0;
  let totalDuration = 0;
  for (let i = 0; i < iterations; i++) {
    const before = getQueryHistory().length;
    const start = Date.now();
    await fn();
    const end = Date.now();
    const after = getQueryHistory().length;
    totalQueries += after - before;
    totalDuration += end - start;
  }
  return {
    averageQueries: totalQueries / iterations,
    averageDuration: totalDuration / iterations,
  };
}
