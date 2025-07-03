import { prisma } from "./db";
import { getQueryHistory } from "./prisma";

let queryCount = 0;

if (process.env.NODE_ENV === "development") {
  prisma.$use(async (params, next) => {
    queryCount++;
    return next(params);
  });
}

export function getQueryCount() {
  return queryCount;
}

export function resetQueryCount() {
  queryCount = 0;
}

export async function withQueryMonitoring<T>(
  label: string,
  fn: () => Promise<T>
): Promise<{ result: T; queryCount: number; duration: number }> {
  const before = getQueryHistory().length;
  const start = Date.now();
  const result = await fn();
  const end = Date.now();
  const after = getQueryHistory().length;
  return {
    result,
    queryCount: after - before,
    duration: end - start,
  };
}
