import path from "path";
import fs from "fs";
import { teamTrackMap, allTracks } from "@/lib/team-track-map";
import QrTrackSelector from "./QrTrackSelector";

const trackDisplayNames = {
  AI_INNOVATION_PREU: "AI Innovation (Pre-University)",
  AI_ART_PREU: "AI Art (Pre-University)",
  AI_TECHNICAL_PREU: "AI Technical (Pre-University)",
  AI_INNOVATION_UPPERSEC: "AI Innovation (Upper Secondary)",
  AI_ART_UPPERSEC: "AI Art (Upper Secondary)",
  AI_TECHNICAL_UPPERSEC: "AI Technical (Upper Secondary)",
};

function getTeamUrlMap() {
  const filePath = path.join(process.cwd(), "team-url-map.local.json");
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data) as Record<string, string>;
}

export default function QrLocalPage() {
  const teamUrlMap = getTeamUrlMap();
  // Group teams by track
  const teamsByTrack: Record<string, { name: string; url: string }[]> = {};
  for (const [name, url] of Object.entries(teamUrlMap)) {
    const track = teamTrackMap[name];
    if (!track) continue;
    if (!teamsByTrack[track]) teamsByTrack[track] = [];
    teamsByTrack[track].push({ name, url });
  }
  return (
    <div className="container mx-auto py-8 px-2 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8 font-sans text-center">
        Local QR Codes
      </h1>
      <QrTrackSelector
        allTracks={allTracks}
        trackDisplayNames={trackDisplayNames}
        teamsByTrack={teamsByTrack}
      />
    </div>
  );
}
