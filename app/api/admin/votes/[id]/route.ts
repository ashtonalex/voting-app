import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Fetch the vote to extract email and track before deleting
    const vote = await prisma.vote.findUnique({
      where: { id: params.id },
      include: {
        team: true,
      },
    })

    if (!vote) {
      return NextResponse.json({ error: "Vote not found" }, { status: 404 })
    }

    const { email } = vote
    const track = vote.team.track

    // Delete the vote
    await prisma.vote.delete({
      where: { id: params.id },
    })

    // Re-count remaining votes for this email and track
    const updatedCount = await prisma.vote.count({
      where: {
        email,
        team: {
          track,
        },
      },
    })

    return NextResponse.json({
      success: true,
      email,
      track,
      updatedCount,
    })
  } catch (error) {
    console.error("Failed to delete vote:", error)
    return NextResponse.json({ error: "Failed to delete vote" }, { status: 500 })
  }
}
