import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Track } from "@prisma/client";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const track = searchParams.get("track");
    const teamId = searchParams.get("teamId");
    const email = searchParams.get("email");
    const applyFilters = searchParams.get("applyFilters") === "true";

    // Initialize where clause for filtered queries
    const where: any = {};

    // Only apply filters for non-"all" values and when filters should be applied
    if (applyFilters) {
      // Add track filter if it's not "all"
      if (track && track !== "all") {
        where.team = { track: track as Track };
      }

      // Add team filter if it's not "all"
      if (teamId && teamId !== "all") {
        where.teamId = teamId;
      }

      // Add email filter if it's not empty
      if (email && email.trim() !== "") {
        where.email = { contains: email.trim(), mode: "insensitive" };
      }
    }

    // Get votes with filters (if any)
    const votes = await prisma.vote.findMany({
      where,
      include: {
        team: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get vote counts - either filtered or unfiltered
    const voteCountsWhere = applyFilters ? where : {};
    const voteCounts = await prisma.vote.groupBy({
      by: ["teamId"],
      _count: {
        id: true,
      },
      where: voteCountsWhere,
    });

    // Get all teams in a single query
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        track: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Create a map for faster team lookups
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

    // Sort teams by vote count in descending order and add rank
    const sortedVoteCounts = voteCountsWithTeams
      .sort((a, b) => b.count - a.count)
      .map((team, index) => ({
        ...team,
        rank: index + 1,
      }));

    // Get total votes - either filtered or unfiltered
    const totalVotes = applyFilters ? votes.length : await prisma.vote.count();

    return NextResponse.json({
      votes,
      voteCounts: sortedVoteCounts,
      totalVotes,
    });
  } catch (error) {
    console.error("Failed to fetch votes:", error);
    return NextResponse.json(
      { error: "Failed to fetch votes" },
      { status: 500 }
    );
  }
}
