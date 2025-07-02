// scripts/print-teams.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teams = await prisma.team.findMany({ select: { id: true, track: true } });
  console.log(JSON.stringify(teams, null, 2));
}
main().finally(() => prisma.$disconnect());