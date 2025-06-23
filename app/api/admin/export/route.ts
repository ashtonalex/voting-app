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

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=votes.csv",
      },
    });
  } catch (error) {
    console.error("Failed to export votes:", error);
    return NextResponse.json(
      { error: "Failed to export votes" },
      { status: 500 }
    );
  }
}
