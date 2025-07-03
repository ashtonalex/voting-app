import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Schema for creating a team
const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  track: z.enum([
    "AI_ART_PREU",
    "AI_ART_UPPERSEC", 
    "AI_INNOVATION_PREU",
    "AI_INNOVATION_UPPERSEC",
    "AI_TECHNICAL_PREU",
    "AI_TECHNICAL_UPPERSEC"
  ])
});

// Schema for bulk team creation
const bulkCreateTeamsSchema = z.object({
  teams: z.array(createTeamSchema)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if it's a bulk creation or single team
    if (body.teams && Array.isArray(body.teams)) {
      // Bulk creation
      const validatedData = bulkCreateTeamsSchema.parse(body);
      
      const results = [];
      let successCount = 0;
      let errorCount = 0;
      
      for (const teamData of validatedData.teams) {
        try {
          const team = await prisma.team.create({
            data: teamData
          });
          results.push({ success: true, team });
          successCount++;
        } catch (error: any) {
          if (error.code === 'P2002') {
            // Team already exists
            results.push({ 
              success: false, 
              error: `Team "${teamData.name}" already exists`,
              team: teamData 
            });
          } else {
            results.push({ 
              success: false, 
              error: error.message,
              team: teamData 
            });
          }
          errorCount++;
        }
      }
      
      return NextResponse.json({
        success: true,
        message: `Created ${successCount} teams, ${errorCount} errors`,
        results,
        summary: {
          total: validatedData.teams.length,
          created: successCount,
          errors: errorCount
        }
      });
      
    } else {
      // Single team creation
      const validatedData = createTeamSchema.parse(body);
      
      const team = await prisma.team.create({
        data: validatedData
      });
      
      return NextResponse.json({
        success: true,
        message: "Team created successfully",
        team
      });
    }
    
  } catch (error: any) {
    console.error("Error creating team(s):", error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Team with this name already exists" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create team", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        track: true,
        _count: {
          select: {
            votes: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    return NextResponse.json({
      success: true,
      teams: teams.map((team: any) => ({
        id: team.id,
        name: team.name,
        track: team.track,
        voteCount: team._count.votes
      }))
    });
    
  } catch (error: any) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams", details: error.message },
      { status: 500 }
    );
  }
} 