export interface QueryLog {
  id: string;
  query: string;
  duration: number;
  timestamp: Date;
  endpoint?: string;
  sessionId?: string;
}

export interface QueryStats {
  totalQueries: number;
  queriesInLastHour: number;
  queriesInLastDay: number;
  byEndpoint: Record<string, number>;
  bySessions: Record<string, number>;
  averageDuration: number;
  peakUsageTimes: Array<{ time: Date; count: number }>;
}
