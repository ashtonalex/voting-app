import { prisma } from "./db";
import type { Prisma } from "@prisma/client";
import dayjs from "dayjs";
import { withQueryMonitoring } from "./query-monitor";

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
 * Uses raw SQL for time-series aggregation for efficiency.
 *
 * @returns {Promise<DashboardData>} Dashboard analytics data
 */
export async function getDashboardData(): Promise<DashboardData> {
  const result = await withQueryMonitoring("dashboard", async () => {
    const now = new Date();
    const since = dayjs(now).subtract(7, "day").toDate();
    const recentSince = dayjs(now).subtract(48, "hour").toDate();

    // Use $queryRaw with proper SQL syntax for PostgreSQL
    const timeSeriesRaw = await prisma.$queryRaw<
      {
        hour: string;
        count: bigint;
      }[]
    >`
      SELECT 
        to_char(date_trunc('hour', "createdAt"), 'YYYY-MM-DD HH24:00') as hour, 
        count(*)::bigint as count
      FROM "Vote"
      WHERE "createdAt" >= ${since}
      GROUP BY hour
      ORDER BY hour ASC
    `;

    const [totalVotes, dateRange, votesByTrack, recentVotes] =
      await prisma.$transaction([
        prisma.vote.count(),
        prisma.vote.aggregate({
          _min: { createdAt: true },
          _max: { createdAt: true },
        }),
        prisma.vote.groupBy({
          by: ["trackId"],
          _count: true,
          orderBy: { trackId: "asc" },
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
      ]);

    // Convert bigint to number for time series data
    const timeSeries = timeSeriesRaw.map((row) => ({
      time: row.hour,
      count: Number(row.count),
    }));

    return {
      totalVotes,
      dateRange: {
        first: dateRange._min.createdAt,
        last: dateRange._max.createdAt,
      },
      votesByTrack: votesByTrack.map((v) => ({
        trackId: v.trackId,
        count:
          typeof v._count === "object" && v._count._all != null
            ? v._count._all
            : 0,
      })),
      recentVotes,
      timeSeries,
    };
  });

  return result.result;
}
