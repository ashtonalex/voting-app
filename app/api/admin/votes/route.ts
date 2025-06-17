import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import type { Track } from "@prisma/client"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const track = searchParams.get("track") as Track | null
    const teamId = searchParams.get("teamId")
    const email = searchParams.get("email")

    const where: any = {}

    if (track) {
      where.team = { track }
    }

    if (teamId) {
      where.teamId = teamId
    }

    if (email) {
      where.email = { contains: email, mode: "insensitive" }
    }

    const votes = await prisma.vote.findMany({
      where,
      include: {
        team: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Get vote counts by track and team
    const voteCounts = await prisma.vote.groupBy({
      by: ["teamId"],
      _count: {
        id: true,
      },
      where,
    })

    const teams = await prisma.team.findMany()

    const voteCountsWithTeams = voteCounts.map((count) => {
      const team = teams.find((t) => t.id === count.teamId)
      return {
        teamId: count.teamId,
        teamName: team?.name || "Unknown",
        track: team?.track || "Unknown",
        count: count._count.id,
      }
    })

    return NextResponse.json({
      votes,
      voteCounts: voteCountsWithTeams,
      totalVotes: votes.length,
    })
  } catch (error) {
    console.error("Failed to fetch votes:", error)
    return NextResponse.json({ error: "Failed to fetch votes" }, { status: 500 })
  }
}
