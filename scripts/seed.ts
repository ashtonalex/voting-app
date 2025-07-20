// scripts/seed.ts
import { PrismaClient, Track } from "@prisma/client";

const prisma = new PrismaClient();

const teams: { name: string; track: Track }[] = [
  // AI_ART_PREU
  { name: "Deepsick", track: "AI_ART_PREU" },
  { name: "AI Avengers", track: "AI_ART_PREU" },
  { name: "Bit Venom", track: "AI_ART_PREU" },
  { name: "Art Attack", track: "AI_ART_PREU" },
  { name: "codeX", track: "AI_ART_PREU" },
  { name: "ai inventors", track: "AI_ART_PREU" },
  { name: "Mesti WIn", track: "AI_ART_PREU" },
  { name: "FIA Kuching", track: "AI_ART_PREU" },
  { name: "KKTMByte", track: "AI_ART_PREU" },
  { name: "Chatgpt", track: "AI_ART_PREU" },

  // AI_ART_UPPERSEC
  { name: "NeuralCreators", track: "AI_ART_UPPERSEC" },
  { name: "Pixel Prophets", track: "AI_ART_UPPERSEC" },
  { name: "Deep Fried Neurons", track: "AI_ART_UPPERSEC" },
  { name: "The Art-Tificials", track: "AI_ART_UPPERSEC" },
  { name: "Algorithmic Artists", track: "AI_ART_UPPERSEC" },
  { name: "PineApples", track: "AI_ART_UPPERSEC" },
  { name: "Sapors", track: "AI_ART_UPPERSEC" },
  { name: "The Four Stars", track: "AI_ART_UPPERSEC" },
  { name: "Ctrl+S+Elite", track: "AI_ART_UPPERSEC" },
  { name: "Original Intelligence", track: "AI_ART_UPPERSEC" },

  // AI_INNOVATION_PREU
  { name: "findU", track: "AI_INNOVATION_PREU" },
  { name: "When you can't C, so you Python", track: "AI_INNOVATION_PREU" },
  { name: "LGG灵感菇", track: "AI_INNOVATION_PREU" },
  { name: "Skibidi Sigma", track: "AI_INNOVATION_PREU" },
  { name: "Seismo AI", track: "AI_INNOVATION_PREU" },
  { name: "Wi-fighters", track: "AI_INNOVATION_PREU" },
  { name: "INNOLAB", track: "AI_INNOVATION_PREU" },
  { name: "Cacat Ginas", track: "AI_INNOVATION_PREU" },
  { name: "NEIVCE LWH 2", track: "AI_INNOVATION_PREU" },
  { name: "404 Name Not Found", track: "AI_INNOVATION_PREU" },

  // AI_INNOVATION_UPPERSEC
  { name: "Eone", track: "AI_INNOVATION_UPPERSEC" },
  { name: "AIvengers", track: "AI_INNOVATION_UPPERSEC" },
  { name: "Strategic Agents", track: "AI_INNOVATION_UPPERSEC" },
  { name: "Frog Dogs", track: "AI_INNOVATION_UPPERSEC" },
  { name: "Blue Jay²", track: "AI_INNOVATION_UPPERSEC" },
  { name: "Microsoft Support Group", track: "AI_INNOVATION_UPPERSEC" },
  { name: "All In For One", track: "AI_INNOVATION_UPPERSEC" },
  { name: "404 Brain Not Found", track: "AI_INNOVATION_UPPERSEC" },
  { name: "Ad Astra", track: "AI_INNOVATION_UPPERSEC" },
  { name: "RedBean", track: "AI_INNOVATION_UPPERSEC" },

  // AI_TECHNICAL_PREU
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

  // AI_TECHNICAL_UPPERSEC
  { name: "The Voyagers", track: "AI_TECHNICAL_UPPERSEC" },
  { name: "harm", track: "AI_TECHNICAL_UPPERSEC" },
  { name: "Hollowlisme", track: "AI_TECHNICAL_UPPERSEC" },
  { name: "brAIn", track: "AI_TECHNICAL_UPPERSEC" },
  { name: "WhatsAI", track: "AI_TECHNICAL_UPPERSEC" },
  { name: "Ouroboros", track: "AI_TECHNICAL_UPPERSEC" },
  { name: "The Future", track: "AI_TECHNICAL_UPPERSEC" },
  { name: "The Blues", track: "AI_TECHNICAL_UPPERSEC" },
  { name: "Error404", track: "AI_TECHNICAL_UPPERSEC" },
  { name: "AetherMind", track: "AI_TECHNICAL_UPPERSEC" },
];

async function main() {
  for (const team of teams) {
    try {
      await prisma.team.create({
        data: team,
      });
    } catch (error) {
      // Skip if team already exists
      console.log(`Team ${team.name} already exists, skipping...`);
    }
  }
  console.log("✅ Seeding complete.");

  // --- AUTOMATION: Update k6/team-ids.json with latest team IDs ---
  const { execSync } = require("child_process");
  try {
    execSync("node scripts/print-teams.js > k6/team-ids.json");
    console.log("✅ k6/team-ids.json updated with latest team IDs.");
  } catch (err) {
    console.error("❌ Failed to update k6/team-ids.json:", err);
  }
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
