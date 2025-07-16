import { prisma } from "./db";
import type { Prisma, Track } from "@prisma/client";
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
    createdAt: Date;
    email: string;
    team: {
      track: Track;
    };
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
      FROM "votes"
      GROUP BY hour
      ORDER BY hour ASC
    `;

    const [totalVotes, dateRange, votesByTeam, recentVotes] =
      await prisma.$transaction([
        prisma.vote.count(),
        prisma.vote.aggregate({
          _min: { createdAt: true },
          _max: { createdAt: true },
        }),
        prisma.vote.groupBy({
          by: ["teamId"],
          _count: true,
          orderBy: { teamId: "asc" },
        }),
        prisma.vote.findMany({
          where: { createdAt: { gte: recentSince } },
          select: {
            id: true,
            teamId: true,
            createdAt: true,
            email: true,
            team: {
              select: {
                track: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
      ]);

    // Get team information to map teamId to track
    const teams = await prisma.team.findMany({
      select: { id: true, track: true },
    });
    const teamTrackMap = new Map(teams.map((team) => [team.id, team.track]));

    // Group votes by track
    const votesByTrackMap = new Map<Track, number>();
    votesByTeam.forEach((voteGroup) => {
      const track = teamTrackMap.get(voteGroup.teamId);
      if (
        track &&
        voteGroup._count &&
        typeof voteGroup._count === "object" &&
        "_all" in voteGroup._count
      ) {
        votesByTrackMap.set(
          track,
          (votesByTrackMap.get(track) || 0) + (voteGroup._count._all || 0)
        );
      }
    });

    const votesByTrack = Array.from(votesByTrackMap.entries()).map(
      ([trackId, count]) => ({
        trackId,
        count,
      })
    );

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
      votesByTrack,
      recentVotes,
      timeSeries,
    };
  });

  return result.result;
}
