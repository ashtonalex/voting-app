import { PrismaClient, Track } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Create sample teams
  const teams = [
    { name: "AI Innovators", track: Track.AI_INNOVATION_PREU },
    { name: "Creative Coders", track: Track.AI_ART_PREU },
    { name: "Tech Titans", track: Track.AI_TECHNICAL_PREU },
    { name: "Future Builders", track: Track.AI_INNOVATION_UPPERSEC },
    { name: "Digital Artists", track: Track.AI_ART_UPPERSEC },
    { name: "Code Masters", track: Track.AI_TECHNICAL_UPPERSEC },
    { name: "Neural Networks", track: Track.AI_TECHNICAL_PREU },
    { name: "Pixel Pioneers", track: Track.AI_ART_UPPERSEC },
  ]

  console.log("Creating teams...")
  for (const team of teams) {
    const createdTeam = await prisma.team.upsert({
      where: { name: team.name },
      update: {},
      create: team,
    })
    console.log(`✅ Created team: ${createdTeam.name} (${createdTeam.track})`)
  }

  // Get all teams to display their IDs for QR code generation
  const allTeams = await prisma.team.findMany()

  console.log("\n🎯 Team voting URLs:")
  allTeams.forEach((team) => {
    console.log(`${team.name}: http://localhost:3000/vote/${team.id}`)
  })

  console.log("\n✅ Database seeded successfully!")
  console.log("🔐 Admin login: password is 'admin123'")
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
