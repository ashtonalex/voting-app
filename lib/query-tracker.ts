import type { QueryLog, QueryStats } from "@/types/query-tracking";

class QueryTracker {
  private static instance: QueryTracker;
  private sessionMap: Map<string, QueryLog[]> = new Map();
  private endpointMap: Map<string, number> = new Map();

  private constructor() {}

  static getInstance() {
    if (!QueryTracker.instance) {
      QueryTracker.instance = new QueryTracker();
    }
    return QueryTracker.instance;
  }

  startSession(sessionId: string) {
    if (!this.sessionMap.has(sessionId)) {
      this.sessionMap.set(sessionId, []);
    }
  }

  endSession(sessionId: string) {
    this.sessionMap.delete(sessionId);
  }

  logQuery(sessionId: string, endpoint: string, log: QueryLog) {
    if (!this.sessionMap.has(sessionId)) {
      this.sessionMap.set(sessionId, []);
    }
    this.sessionMap.get(sessionId)!.push(log);
    this.endpointMap.set(endpoint, (this.endpointMap.get(endpoint) || 0) + 1);
  }

  getSessionQueries(sessionId: string): QueryLog[] {
    return this.sessionMap.get(sessionId) || [];
  }

  getStats(): QueryStats {
    let totalQueries = 0;
    let bySessions: Record<string, number> = {};
    let byEndpoint: Record<string, number> = {};
    let durations: number[] = [];
    for (const [sessionId, logs] of this.sessionMap.entries()) {
      bySessions[sessionId] = logs.length;
      totalQueries += logs.length;
      for (const log of logs) {
        durations.push(log.duration);
        if (log.endpoint) {
          byEndpoint[log.endpoint] = (byEndpoint[log.endpoint] || 0) + 1;
        }
      }
    }
    const averageDuration = durations.length
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;
    return {
      totalQueries,
      queriesInLastHour: 0, // Not tracked here
      queriesInLastDay: 0, // Not tracked here
      byEndpoint,
      bySessions,
      averageDuration,
      peakUsageTimes: [], // Not tracked here
    };
  }
}

export { QueryTracker };
