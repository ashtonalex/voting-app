// Seed the Vercel database using the local Prisma setup
const { PrismaClient } = require('@prisma/client');

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

async function seedVercelDatabase() {
  console.log("🌱 Seeding Vercel database...");
  console.log("⚠️  Make sure your DATABASE_URL is set to the Vercel database!");
  
  const prisma = new PrismaClient();
  
  try {
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const team of teams) {
      try {
        await prisma.team.create({
          data: team,
        });
        console.log(`✅ Created team: ${team.name} (${team.track})`);
        createdCount++;
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⏭️  Team already exists: ${team.name} (${team.track})`);
          skippedCount++;
        } else {
          console.log(`❌ Error creating team ${team.name}:`, error.message);
        }
      }
    }
    
    console.log(`\n📊 Seeding Summary:`);
    console.log(`✅ Created: ${createdCount} teams`);
    console.log(`⏭️  Skipped (already exist): ${skippedCount} teams`);
    console.log(`📝 Total: ${createdCount + skippedCount} teams`);
    
    if (createdCount > 0) {
      console.log(`\n🎉 Successfully seeded the database!`);
      console.log("🚀 You can now run the soak test.");
    } else {
      console.log(`\n⚠️  No new teams were created. Database might already be seeded.`);
    }
    
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
    console.log("\n💡 Make sure to:");
    console.log("1. Set DATABASE_URL to your Vercel database URL");
    console.log("2. Run: export DATABASE_URL='your-vercel-database-url'");
    console.log("3. Or create a .env file with the DATABASE_URL");
  } finally {
    await prisma.$disconnect();
  }
}

seedVercelDatabase(); 