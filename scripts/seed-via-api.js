// Seed database via API calls
const BASE_URL = "https://voting-app-rouge.vercel.app";

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

async function seedDatabase() {
  console.log("🌱 Seeding database via API...");
  console.log(`Target URL: ${BASE_URL}/api/vote`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    
    // Create a test vote to trigger team creation
    const payload = {
      teamId: `team-${i + 1}`, // Use a simple ID format
      email: `seed-${i + 1}@test.com`
    };
    
    try {
      const response = await fetch(`${BASE_URL}/api/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (response.status === 404 && data.error === "Team not found") {
        console.log(`⚠️  Team ${team.name} not found (expected for seeding)`);
        errorCount++;
      } else if (response.ok) {
        console.log(`✅ Successfully voted for team ${team.name}`);
        successCount++;
      } else {
        console.log(`❌ Error voting for team ${team.name}: ${data.error}`);
        errorCount++;
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.log(`❌ Network error for team ${team.name}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Seeding Summary:`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📝 Note: 404 errors are expected if teams don't exist yet`);
}

seedDatabase(); 