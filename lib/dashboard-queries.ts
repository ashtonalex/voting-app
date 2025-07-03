import { prisma } from "./db";
import type { Prisma } from "@prisma/client";
import dayjs from "dayjs";

/**
 * Dashboard data structure for admin analytics
 */
export interface DashboardData {
  totalVotes: number;
  dateRange: { first: Date | null; last: Date | null };
  votesByTrack: { trackId: string; count: number }[];
  recentVotes: {
    id: string;
    teamId: string;
    trackId: string;
    createdAt: Date;
    email: string;
  }[];
  timeSeries: { time: string; count: number }[];
}

/**
 * Fetches all dashboard data in a single transaction for optimal performance.
 * - Overall stats (total votes, date range)
 * - Vote breakdown by trackId
 * - Recent activity (last 48 hours)
 * - Time-series data (last 7 days, grouped by hour)
 */
export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date();
  const since = dayjs(now).subtract(7, "day").toDate();
  const recentSince = dayjs(now).subtract(48, "hour").toDate();

  const [totalVotes, dateRange, votesByTrack, recentVotes, timeSeriesRaw] =
    await prisma.$transaction([
      prisma.vote.count(),
      prisma.vote.aggregate({
        _min: { createdAt: true },
        _max: { createdAt: true },
      }),
      prisma.vote.groupBy({
        by: ["trackId"],
        _count: { _all: true },
      }),
      prisma.vote.findMany({
        where: { createdAt: { gte: recentSince } },
        select: {
          id: true,
          teamId: true,
          trackId: true,
          createdAt: true,
          email: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.vote.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

  // Time-series: group by hour
  const buckets: Record<string, number> = {};
  for (const v of timeSeriesRaw) {
    const key = dayjs(v.createdAt).format("YYYY-MM-DD HH:00");
    buckets[key] = (buckets[key] || 0) + 1;
  }
  const timeSeries = Object.entries(buckets)
    .map(([time, count]) => ({ time, count }))
    .sort((a, b) => a.time.localeCompare(b.time));

  return {
    totalVotes,
    dateRange: {
      first: dateRange._min.createdAt,
      last: dateRange._max.createdAt,
    },
    votesByTrack: votesByTrack.map((v) => ({
      trackId: v.trackId,
      count: v._count._all,
    })),
    recentVotes,
    timeSeries,
  };
}
