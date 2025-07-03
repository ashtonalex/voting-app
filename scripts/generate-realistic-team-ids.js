// Generate realistic team IDs for soak testing
const fs = require('fs');
const path = require('path');

// Team data from seed.ts
const teams = [
  { name: "AI Art Masters", track: "AI_ART_PREU" },
  { name: "Creative Coders", track: "AI_ART_PREU" },
  { name: "Digital Dreamers", track: "AI_ART_PREU" },
  { name: "Pixel Pioneers", track: "AI_ART_PREU" },
  { name: "Visual Virtuosos", track: "AI_ART_PREU" },
  { name: "Artistic Algorithms", track: "AI_ART_PREU" },
  { name: "Canvas Coders", track: "AI_ART_PREU" },
  { name: "Design Dynamos", track: "AI_ART_PREU" },
  { name: "Creative Collective", track: "AI_ART_PREU" },
  { name: "Art & Code Alliance", track: "AI_ART_PREU" },
  
  { name: "UpperSec Artists", track: "AI_ART_UPPERSEC" },
  { name: "Advanced Artisans", track: "AI_ART_UPPERSEC" },
  { name: "Elite Creators", track: "AI_ART_UPPERSEC" },
  { name: "Senior Sketchers", track: "AI_ART_UPPERSEC" },
  { name: "Master Makers", track: "AI_ART_UPPERSEC" },
  { name: "Pro Painters", track: "AI_ART_UPPERSEC" },
  { name: "Expert Expressers", track: "AI_ART_UPPERSEC" },
  { name: "Veteran Visualists", track: "AI_ART_UPPERSEC" },
  { name: "Senior Stylists", track: "AI_ART_UPPERSEC" },
  { name: "Advanced Aesthetes", track: "AI_ART_UPPERSEC" },
  
  { name: "Innovation Squad", track: "AI_INNOVATION_PREU" },
  { name: "Creative Minds", track: "AI_INNOVATION_PREU" },
  { name: "Future Thinkers", track: "AI_INNOVATION_PREU" },
  { name: "Idea Incubators", track: "AI_INNOVATION_PREU" },
  { name: "Brainstorm Brigade", track: "AI_INNOVATION_PREU" },
  { name: "Innovation Institute", track: "AI_INNOVATION_PREU" },
  { name: "Creative Catalysts", track: "AI_INNOVATION_PREU" },
  { name: "Idea Engineers", track: "AI_INNOVATION_PREU" },
  { name: "Innovation Lab", track: "AI_INNOVATION_PREU" },
  { name: "Creative Collective", track: "AI_INNOVATION_PREU" },
  
  { name: "AIvengers", track: "AI_INNOVATION_UPPERSEC" },
  { name: "Strategic Agents", track: "AI_INNOVATION_UPPERSEC" },
  { name: "Frog Dogs", track: "AI_INNOVATION_UPPERSEC" },
  { name: "Blue Jay²", track: "AI_INNOVATION_UPPERSEC" },
  { name: "Microsoft Support Group", track: "AI_INNOVATION_UPPERSEC" },
  { name: "All In For One", track: "AI_INNOVATION_UPPERSEC" },
  { name: "404 Brain Not Found", track: "AI_INNOVATION_UPPERSEC" },
  { name: "Ad Astra", track: "AI_INNOVATION_UPPERSEC" },
  { name: "RedBean", track: "AI_INNOVATION_UPPERSEC" },
  
  { name: "kthxbyte", track: "AI_TECHNICAL_PREU" },
  { name: "Chincai", track: "AI_TECHNICAL_PREU" },
  { name: "Sunway ADTP innovators", track: "AI_TECHNICAL_PREU" },
  { name: "404", track: "AI_TECHNICAL_PREU" },
  { name: "Code Storm", track: "AI_TECHNICAL_PREU" },
  { name: "VARS", track: "AI_TECHNICAL_PREU" },
  { name: "CantByteUs", track: "AI_TECHNICAL_PREU" },
  { name: "Earendel", track: "AI_TECHNICAL_PREU" },
  { name: "ZYLCH AI", track: "AI_TECHNICAL_PREU" },
  { name: "MONKIE BOI SKUAD", track: "AI_TECHNICAL_PREU" },
  
  { name: "The Voyagers", track: "AI_TECHNICAL_UPPERSEC" },
  { name: "harm", track: "AI_TECHNICAL_UPPERSEC" },
  { name: "Hollowlisme", track: "AI_TECHNICAL_UPPERSEC" },
  { name: "brAIn", track: "AI_TECHNICAL_UPPERSEC" },
  { name: "WhatsAI", track: "AI_TECHNICAL_UPPERSEC" },
  { name: "Ouroboros", track: "AI_TECHNICAL_UPPERSEC" },
  { name: "The Future", track: "AI_TECHNICAL_UPPERSEC" },
  { name: "The Blues", track: "AI_TECHNICAL_UPPERSEC" },
  { name: "Error404", track: "AI_TECHNICAL_UPPERSEC" },
  { name: "AetherMind", track: "AI_TECHNICAL_UPPERSEC" }
];

function generateTeamIds() {
  console.log("🔧 Generating realistic team IDs for soak testing...");
  
  // Generate realistic CUID-like IDs (similar to what Prisma generates)
  const teamIdsForK6 = teams.map((team, index) => {
    // Generate a realistic CUID-like ID
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    const id = `cl${timestamp}${random}${index.toString().padStart(3, '0')}`;
    
    return {
      id: id,
      track: team.track
    };
  });
  
  // Save to k6/team-ids.json
  const outputPath = path.join(process.cwd(), "k6", "team-ids.json");
  fs.writeFileSync(outputPath, JSON.stringify(teamIdsForK6, null, 2), "utf-8");
  
  console.log(`✅ Generated ${teamIdsForK6.length} team IDs`);
  console.log(`📁 Saved to: ${outputPath}`);
  
  // Show a few examples
  console.log("\n📋 Sample team IDs:");
  teamIdsForK6.slice(0, 5).forEach((team, index) => {
    console.log(`  ${index + 1}. ${teams[index].name} (${team.track}): ${team.id}`);
  });
  
  console.log(`\n📊 Ready for soak testing with ${teamIdsForK6.length} teams`);
  console.log("💡 Note: These are generated IDs. For real testing, you'll need to seed the database first.");
}

generateTeamIds(); 