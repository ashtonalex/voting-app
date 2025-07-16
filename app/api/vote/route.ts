import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { voteSchema } from "@/lib/validations";
import { revalidateDashboardTag } from "@/lib/dashboard-cache";

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY!;
const CAPTCHA_ENABLED = process.env.CAPTCHA_ENABLED === "true";

export async function POST(request: NextRequest) {
  try {
    console.log("Vote submission started");

    const body = await request.json();
    console.log("Request body:", body);

    const { teamId, token } = body;

    if (!teamId) {
      console.log("Missing teamId");
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    if (CAPTCHA_ENABLED) {
      if (!token) {
        console.log("Missing CAPTCHA token");
        return NextResponse.json(
          { error: "CAPTCHA verification required" },
          { status: 400 }
        );
      }
      // ✅ Verify CAPTCHA with Cloudflare
      console.log("Verifying CAPTCHA token...");
      const captchaRes = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `secret=${TURNSTILE_SECRET_KEY}&response=${token}`,
        }
      );

      const captchaJson = await captchaRes.json();
      console.log("CAPTCHA verification result:", captchaJson);

      if (!captchaJson.success) {
        return NextResponse.json(
          { error: "CAPTCHA verification failed" },
          { status: 403 }
        );
      }
    }

    console.log("Validating input data...");
    const validatedData = voteSchema.parse(body);
    console.log("Validation passed:", validatedData);

    console.log("Checking if team exists...");
    const team = await prisma.team.findUnique({ where: { id: teamId } });

    if (!team) {
      console.log("Team not found:", teamId);
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    console.log("Checking existing votes...");
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
        { error: "You have already voted 2 times for this track" },
        { status: 400 }
      );
    }

    console.log("Creating vote...");
    const vote = await prisma.vote.create({
      data: {
        email: validatedData.email,
        teamId: teamId,
        trackId: team.track,
      },
      include: { team: true },
    });

    console.log("Vote created successfully:", vote.id);

    // Invalidate dashboard cache with better error handling
    try {
      console.log("Invalidating dashboard cache...");
      await revalidateDashboardTag();
      console.log("Dashboard cache invalidated successfully");
    } catch (cacheError) {
      console.error("Failed to invalidate dashboard cache:", cacheError);
      // Don't fail the vote submission if cache invalidation fails
      // The vote was successful, just log the cache error
    }

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
        { error: "You have already voted for this team" },
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