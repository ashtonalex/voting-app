import { PrismaClient } from "@prisma/client";
import type { QueryLog, QueryStats } from "@/types/query-tracking";
import crypto from "crypto";

const isDev = process.env.NODE_ENV !== "production";
const QUERY_HISTORY_LIMIT = 200;

let prisma: PrismaClient;
let globalForPrisma = global as unknown as { prisma?: PrismaClient };

// Query tracking state
let totalQueries = 0;
let queryHistory: QueryLog[] = [];
let queryStats: QueryStats = {
  totalQueries: 0,
  queriesInLastHour: 0,
  queriesInLastDay: 0,
  byEndpoint: {},
  bySessions: {},
  averageDuration: 0,
  peakUsageTimes: [],
};

function addQueryLog(log: Omit<QueryLog, "id">) {
  const id = crypto.randomUUID();
  const entry: QueryLog = { id, ...log };
  queryHistory.push(entry);
  if (queryHistory.length > QUERY_HISTORY_LIMIT) queryHistory.shift();
  totalQueries++;
  // Update stats
  queryStats.totalQueries = totalQueries;
  // Remove old logs for memory
  const now = Date.now();
  queryHistory = queryHistory.filter(
    (q) => now - q.timestamp.getTime() < 1000 * 60 * 60 * 24
  );
}

function getQueryHistory() {
  return [...queryHistory];
}

function getQueryStats(): QueryStats {
  const now = Date.now();
  const oneHourAgo = now - 1000 * 60 * 60;
  const oneDayAgo = now - 1000 * 60 * 60 * 24;
  const lastHour = queryHistory.filter(
    (q) => q.timestamp.getTime() > oneHourAgo
  );
  const lastDay = queryHistory.filter((q) => q.timestamp.getTime() > oneDayAgo);
  const byEndpoint: Record<string, number> = {};
  const bySessions: Record<string, number> = {};
  let totalDuration = 0;
  let peakMap = new Map<string, number>();
  for (const q of queryHistory) {
    if (q.endpoint) byEndpoint[q.endpoint] = (byEndpoint[q.endpoint] || 0) + 1;
    if (q.sessionId)
      bySessions[q.sessionId] = (bySessions[q.sessionId] || 0) + 1;
    totalDuration += q.duration;
    const hour = new Date(q.timestamp);
    hour.setMinutes(0, 0, 0);
    const key = hour.toISOString();
    peakMap.set(key, (peakMap.get(key) || 0) + 1);
  }
  const peakUsageTimes = Array.from(peakMap.entries()).map(([time, count]) => ({
    time: new Date(time),
    count,
  }));
  return {
    totalQueries,
    queriesInLastHour: lastHour.length,
    queriesInLastDay: lastDay.length,
    byEndpoint,
    bySessions,
    averageDuration: queryHistory.length
      ? totalDuration / queryHistory.length
      : 0,
    peakUsageTimes,
  };
}

if (!globalForPrisma.prisma) {
  prisma = new PrismaClient({
    log: isDev ? ["query", "info", "warn", "error"] : ["error"],
  });

  prisma.$on("query", (e: any) => {
    const log: Omit<QueryLog, "id"> = {
      query: e.query,
      duration: e.duration,
      timestamp: new Date(),
      endpoint: e.endpoint,
      sessionId: e.sessionId,
    };
    addQueryLog(log);
    if (isDev) {
      // eslint-disable-next-line no-console
      console.log(`[Prisma Query]`, {
        query: e.query,
        duration: e.duration,
        timestamp: log.timestamp,
        endpoint: e.endpoint,
        sessionId: e.sessionId,
      });
    }
  });

  globalForPrisma.prisma = prisma;
} else {
  prisma = globalForPrisma.prisma;
}

export { prisma, getQueryHistory, getQueryStats };
