import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Track } from "@prisma/client";
import dayjs from "dayjs";

export const GET = async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    // If the request is for timeline data, return timeline aggregation
    const granularity = searchParams.get("granularity");
    const isTimeline =
      request.nextUrl.pathname.endsWith("/timeline") ||
      searchParams.get("timeline") === "1";
    if (isTimeline || granularity) {
      // Timeline logic
      const timelineGranularity = granularity || "hour";
      const votes = await prisma.vote.findMany({
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      });
      const buckets: Record<string, number> = {};
      for (const vote of votes) {
        let key: string;
        if (timelineGranularity === "day") {
          key = dayjs(vote.createdAt).format("YYYY-MM-DD");
        } else if (timelineGranularity === "30min") {
          // Bucket into 30-minute intervals
          const date = dayjs(vote.createdAt);
          const minutes = date.minute();
          const roundedMinutes = minutes < 30 ? "00" : "30";
          key = date.format(`YYYY-MM-DD HH:${roundedMinutes}`);
        } else {
          // Default to hour
          key = dayjs(vote.createdAt).format("YYYY-MM-DD HH:00");
        }
        buckets[key] = (buckets[key] || 0) + 1;
      }
      const timeline = Object.entries(buckets).map(([time, count]) => ({
        time,
        count,
      }));
      timeline.sort((a, b) => a.time.localeCompare(b.time));
      return NextResponse.json({ timeline });
    }
    // Default: votes, voteCounts, totalVotes
    const track = searchParams.get("track");
    const teamId = searchParams.get("teamId");
    const email = searchParams.get("email");
    const applyFilters = searchParams.get("applyFilters") === "true";
    const where: any = {};
    if (applyFilters) {
      if (track && track !== "all") {
        where.team = { track: track as Track };
      }
      if (teamId && teamId !== "all") {
        where.teamId = teamId;
      }
      if (email && email.trim() !== "") {
        where.email = { contains: email.trim(), mode: "insensitive" };
      }
    }
    const votes = await prisma.vote.findMany({
      where,
      include: { team: true },
      orderBy: { createdAt: "desc" },
    });
    const voteCountsWhere = applyFilters ? where : {};
    const voteCounts = await prisma.vote.groupBy({
      by: ["teamId"],
      _count: { id: true },
      where: voteCountsWhere,
    });
    const teams = await prisma.team.findMany({
      select: { id: true, name: true, track: true },
      orderBy: { name: "asc" },
    });
    const teamsMap = new Map(teams.map((team) => [team.id, team]));
    const voteCountsWithTeams = voteCounts.map((count) => {
      const team = teamsMap.get(count.teamId);
      return {
        teamId: count.teamId,
        teamName: team?.name || "Unknown",
        track: team?.track || "Unknown",
        count: count._count.id,
      };
    });
    const sortedVoteCounts = voteCountsWithTeams
      .sort((a, b) => b.count - a.count)
      .map((team, index) => ({ ...team, rank: index + 1 }));
    const totalVotes = applyFilters ? votes.length : await prisma.vote.count();
    return NextResponse.json({
      votes,
      voteCounts: sortedVoteCounts,
      totalVotes,
    });
  } catch (error) {
    console.error("Failed to fetch votes or timeline:", error);
    return NextResponse.json(
      { error: "Failed to fetch votes or timeline" },
      { status: 500 }
    );
  }
};
