// Seed database via the teams API endpoint
const BASE_URL = "https://voting-app-rouge.vercel.app";

// Teams data from seed.ts
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

async function seedDatabase() {
  console.log("🌱 Seeding database via teams API...");
  console.log(`Target URL: ${BASE_URL}/api/admin/teams`);
  
  try {
    // Use bulk creation to add all teams at once
    const payload = { teams };
    
    const response = await fetch(`${BASE_URL}/api/admin/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log("✅ Successfully seeded database!");
      console.log(`📊 Summary: ${data.summary.created} created, ${data.summary.errors} errors`);
      
      if (data.summary.created > 0) {
        console.log("\n🎉 Teams created successfully!");
        console.log("🚀 You can now run the soak test.");
        
        // Update the team-ids.json file with the actual team IDs
        if (data.results && data.results.length > 0) {
          const fs = require('fs');
          const path = require('path');
          
          const teamIdsForK6 = data.results
            .filter(result => result.success)
            .map(result => ({
              id: result.team.id,
              track: result.team.track
            }));
          
          const outputPath = path.join(process.cwd(), "k6", "team-ids.json");
          fs.writeFileSync(outputPath, JSON.stringify(teamIdsForK6, null, 2), "utf-8");
          
          console.log(`\n📁 Updated k6/team-ids.json with ${teamIdsForK6.length} real team IDs`);
        }
      } else {
        console.log("\n⚠️  No new teams were created. Database might already be seeded.");
      }
      
      // Show some details about what happened
      if (data.results) {
        console.log("\n📋 Results:");
        data.results.forEach((result, index) => {
          if (result.success) {
            console.log(`  ✅ ${result.team.name} (${result.team.track}): ${result.team.id}`);
          } else {
            console.log(`  ⚠️  ${result.team.name}: ${result.error}`);
          }
        });
      }
      
    } else {
      console.log(`❌ Error seeding database: ${data.error}`);
      if (data.details) {
        console.log(`Details: ${JSON.stringify(data.details, null, 2)}`);
      }
    }
    
  } catch (error) {
    console.error("❌ Network error:", error.message);
  }
}

seedDatabase(); 