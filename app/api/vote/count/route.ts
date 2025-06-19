import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const email = session.user.email;

    // Count all votes for this email
    const totalVotes = await prisma.vote.count({
      where: { email },
    });
    return NextResponse.json({ email, totalVotes });
  } catch (error) {
    console.error("Vote count error:", error);
    return NextResponse.json(
      { error: "Failed to fetch vote count" },
      { status: 500 }
    );
  }
}
