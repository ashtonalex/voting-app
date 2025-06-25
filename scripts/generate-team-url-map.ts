import { prisma } from "../lib/db";
import { sanitizeTeamName } from "../lib/utils";
import fs from "fs";
import path from "path";

// Allow BASE_URL to be set via env or CLI arg
const argUrl = process.argv[2];
const BASE_URL =
  argUrl || process.env.BASE_URL || "https://voting-app-peach.vercel.app/vote";

async function main() {
  const teams = await prisma.team.findMany();
  const slugMap: Record<string, string> = {};
  const usedSlugs = new Set<string>();

  for (const team of teams) {
    const slug = sanitizeTeamName(team.name);
    if (usedSlugs.has(slug)) {
      throw new Error(`Slug collision detected for slug: ${slug}`);
    }
    usedSlugs.add(slug);
    slugMap[team.name] = `${BASE_URL}/${slug}`;
  }

  // Output file name based on BASE_URL
  const outFile = BASE_URL.includes("localhost")
    ? "team-url-map.local.json"
    : "team-url-map.json";
  const outPath = path.join(process.cwd(), outFile);
  fs.writeFileSync(outPath, JSON.stringify(slugMap, null, 2), "utf-8");
  console.log(`✅ ${outFile} generated at ${outPath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
