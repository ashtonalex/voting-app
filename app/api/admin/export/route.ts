import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const track = searchParams.get("track");
    const teamId = searchParams.get("teamId");
    const mode = searchParams.get("mode") || "log";

    const where: any = {};
    if (track) {
      where.team = { ...(where.team || {}), track };
    }
    if (teamId) {
      where.team = {
        ...(where.team || {}),
        ...(track ? { track } : {}),
        id: teamId,
      };
    }

    if (mode === "counts") {
      // Aggregate vote counts per team
      const votes = await prisma.vote.findMany({
        include: { team: true },
        where: Object.keys(where).length > 0 ? where : undefined,
      });
      // Map: teamId -> { teamName, track, count }
      const teamCounts: Record<
        string,
        { teamName: string; track: string; count: number }
      > = {};
      for (const vote of votes) {
        const key = vote.team.id;
        if (!teamCounts[key]) {
          teamCounts[key] = {
            teamName: vote.team.name,
            track: vote.team.track,
            count: 0,
          };
        }
        teamCounts[key].count++;
      }
      const csvHeader = "Team Name,Track,Total Votes\n";
      const csvRows = Object.values(teamCounts)
        .map((t) => `${t.teamName},${t.track},${t.count}`)
        .join("\n");
      const csv = csvHeader + csvRows;
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename=${
            mode === "counts" ? "vote-counts.csv" : "votes.csv"
          }`,
        },
      });
    } else {
      // Vote entry log (default)
      const votes = await prisma.vote.findMany({
        include: {
          team: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        where: Object.keys(where).length > 0 ? where : undefined,
      });
      // Convert to CSV
      const csvHeader = "ID,Email,Team Name,Track,Created At\n";
      const csvRows = votes
        .map(
          (vote) =>
            `${vote.id},${vote.email},${vote.team.name},${
              vote.team.track
            },${vote.createdAt.toISOString()}`
        )
        .join("\n");
      const csv = csvHeader + csvRows;
      // Determine filename based on filters and mode
      let filename = mode === "counts" ? "vote-counts.csv" : "votes.csv";
      if (track && teamId) {
        filename =
          mode === "counts"
            ? `vote-counts_track-${track}_team-${teamId}.csv`
            : `votes_track-${track}_team-${teamId}.csv`;
      } else if (track) {
        filename =
          mode === "counts"
            ? `vote-counts_track-${track}.csv`
            : `votes_track-${track}.csv`;
      } else if (teamId) {
        filename =
          mode === "counts"
            ? `vote-counts_team-${teamId}.csv`
            : `votes_team-${teamId}.csv`;
      }
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename=${filename}`,
        },
      });
    }
  } catch (error) {
    console.error("Failed to export votes:", error);
    return NextResponse.json(
      { error: "Failed to export votes" },
      { status: 500 }
    );
  }
}
