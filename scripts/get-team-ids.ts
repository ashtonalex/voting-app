import { prisma } from "../lib/db";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🔍 Fetching team IDs from database...");
  
  try {
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        track: true,
        name: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`✅ Found ${teams.length} teams:`);
    teams.forEach((team: any) => {
      console.log(`  - ${team.name} (${team.track}): ${team.id}`);
    });

    // Create the team IDs array for k6
    const teamIdsForK6 = teams.map((team: any) => ({
      id: team.id,
      track: team.track
    }));

    // Save to k6/team-ids.json
    const outputPath = path.join(process.cwd(), "k6", "team-ids.json");
    fs.writeFileSync(outputPath, JSON.stringify(teamIdsForK6, null, 2), "utf-8");
    
    console.log(`\n✅ Team IDs saved to: ${outputPath}`);
    console.log(`📊 Ready for soak testing with ${teams.length} teams`);
    
  } catch (error) {
    console.error("❌ Error fetching teams:", error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error("❌ Script failed:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  }); 