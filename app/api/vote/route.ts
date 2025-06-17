import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { voteSchema } from "@/lib/validations"
import { verifyTurnstile } from "@/lib/utils"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { teamId } = body

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 })
    }

    // Validate input
    const validatedData = voteSchema.parse(body)

    // Verify Turnstile token
    const isValidTurnstile = await verifyTurnstile(validatedData.turnstileToken)
    if (!isValidTurnstile) {
      return NextResponse.json({ error: "Invalid verification token" }, { status: 400 })
    }

    // Get team and check if it exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Check voting limit for this email and track
    const existingVotes = await prisma.vote.count({
      where: {
        email: validatedData.email,
        team: {
          track: team.track,
        },
      },
    })

    if (existingVotes >= 2) {
      return NextResponse.json(
        {
          error: "You have already voted 2 times for this track",
        },
        { status: 400 },
      )
    }

    // Create the vote
    const vote = await prisma.vote.create({
      data: {
        email: validatedData.email,
        teamId: teamId,
      },
      include: {
        team: true,
      },
    })

    return NextResponse.json({
      success: true,
      vote,
      voteCount: existingVotes + 1,
    })
  } catch (error) {
    console.error("Vote submission error:", error)

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        {
          error: "You have already voted for this team",
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        error: "Failed to submit vote",
      },
      { status: 500 },
    )
  }
}
