import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./lib/db";
import { sanitizeTeamName } from "./lib/utils";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Match /vote/:teamId where teamId is a 24-char cuid (or adjust regex for your ID format)
  const match = pathname.match(/^\/vote\/([a-z0-9]{24,})$/i);
  if (match) {
    const teamId = match[1];
    // Look up the team by ID
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (team) {
      const slug = sanitizeTeamName(team.name);
      const url = request.nextUrl.clone();
      url.pathname = `/vote/${slug}`;
      return NextResponse.redirect(url, 308);
    }
  }
  // Default: continue
  return NextResponse.next();
}

export const config = {
  matcher: ["/vote/:path*"],
};
