import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Track } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const email = session.user.email
    const { searchParams } = new URL(request.url)
    const trackParam = searchParams.get("track")

    if (!trackParam || !(trackParam in Track)) {
      return NextResponse.json({ error: "Invalid or missing track parameter" }, { status: 400 })
    }

    const track = trackParam as Track

    const count = await prisma.vote.count({
      where: {
        email,
        team: {
          track,
        },
      },
    })

    return NextResponse.json({ email, count })
  } catch (error) {
    console.error("Vote count error:", error)
    return NextResponse.json(
      { error: "Failed to fetch vote count" },
      { status: 500 }
    )
  }
}
