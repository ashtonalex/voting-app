import { getServerSession } from "next-auth";
import { type NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { voteSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const email = session.user.email;

    const body = await request.json();
    const { teamId } = body;

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    // Validate input (remove email from validation, use session email)
    const validatedData = voteSchema.omit({ email: true }).parse(body);

    // Get team and check if it exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check voting limit for this email and track
    const existingVotes = await prisma.vote.count({
      where: {
        email: email,
        team: {
          track: team.track,
        },
      },
    });

    if (existingVotes >= 2) {
      return NextResponse.json(
        {
          error: "You have already voted 2 times for this track",
        },
        { status: 400 }
      );
    }

    // Create the vote
    const vote = await prisma.vote.create({
      data: {
        email: email,
        teamId: teamId,
      },
      include: {
        team: true,
      },
    });

    return NextResponse.json({
      success: true,
      vote,
      voteCount: existingVotes + 1,
      message: "Vote submitted successfully!",
    });
  } catch (error) {
    console.error("Vote submission error:", error);

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        {
          error: "You have already voted for this team",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to submit vote",
      },
      { status: 500 }
    );
  }
}
