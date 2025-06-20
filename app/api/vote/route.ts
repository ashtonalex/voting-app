import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { voteSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    console.log("Vote submission started");

    const body = await request.json();
    console.log("Request body:", body);

    const { teamId } = body;

    if (!teamId) {
      console.log("Missing teamId");
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    console.log("Validating input data...");
    // Validate input
    const validatedData = voteSchema.parse(body);
    console.log("Validation passed:", validatedData);

    console.log("Checking if team exists...");
    // Get team and check if it exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      console.log("Team not found:", teamId);
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    console.log("Team found:", team.name);

    console.log("Checking existing votes...");
    // Check voting limit for this email and track
    const existingVotes = await prisma.vote.count({
      where: {
        email: validatedData.email,
        team: {
          track: team.track,
        },
      },
    });

    console.log("Existing votes for this email and track:", existingVotes);

    if (existingVotes >= 2) {
      console.log("Vote limit exceeded");
      return NextResponse.json(
        {
          error: "You have already voted 2 times for this track",
        },
        { status: 400 }
      );
    }

    console.log("Creating vote...");
    // Create the vote
    const vote = await prisma.vote.create({
      data: {
        email: validatedData.email,
        teamId: teamId,
        trackId: team.track,
      },
      include: {
        team: true,
      },
    });

    console.log("Vote created successfully:", vote.id);

    return NextResponse.json({
      success: true,
      vote,
      voteCount: existingVotes + 1,
      message: "Vote submitted successfully!",
    });
  } catch (error) {
    console.error("Vote submission error:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );

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
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
