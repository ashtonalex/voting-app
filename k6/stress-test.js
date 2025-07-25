import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate } from "k6/metrics";

// Load team IDs from JSON file
const teamData = JSON.parse(open(__ENV.TEAM_IDS_PATH || "k6/team-ids.json"));

// Group team IDs by track
const tracks = {};
for (const t of teamData) {
  if (!tracks[t.track]) tracks[t.track] = [];
  tracks[t.track].push(t.id);
}
const trackNames = Object.keys(tracks);

export const options = {
  stages: [
    { duration: "5m", target: 800 }, // ramp-up
    { duration: "20min", target: 800 }, // peak load
    { duration: "5m", target: 0 }, // ramp-down
  ],
  thresholds: {
    http_req_duration: ["p(95)<5000"], // 95% of requests < 5000ms
    http_req_failed: ["rate<0.15"], // < 15% failure rate
  },
};

const voteDuration = new Trend("vote_duration");
const voteSuccess = new Rate("vote_success");

// Each VU gets its own voting state
const vuState = {};

function logRequestAndResponse(payload, res) {
  console.error(
    JSON.stringify({
      type: "vote_error",
      request: JSON.parse(payload),
      response: {
        status: res.status,
        body: res.body,
        headers: res.headers,
      },
      timestamp: new Date().toISOString(),
    })
  );
}

export default function () {
  // Each VU is a unique voter
  const vuId = __VU;
  if (!vuState[vuId]) {
    // For each track, track voted team IDs (max 2 per track)
    vuState[vuId] = {};
    for (const track of trackNames) {
      vuState[vuId][track] = [];
    }
  }
  const state = vuState[vuId];

  // Find tracks where this VU can still vote
  let availableTracks = trackNames.filter(
    (track) =>
      state[track].length < 2 && tracks[track].length > state[track].length
  );
  if (availableTracks.length === 0) {
    // All tracks exhausted for this VU, reset state to start over
    for (const track of trackNames) {
      state[track] = [];
    }
    availableTracks = trackNames.slice();
  }

  // Pick a random track with votes left
  const track =
    availableTracks[Math.floor(Math.random() * availableTracks.length)];
  // Pick a team in this track that hasn't been voted for by this VU
  const availableTeams = tracks[track].filter(
    (id) => !state[track].includes(id)
  );
  if (availableTeams.length === 0) {
    // Shouldn't happen, but just in case
    sleep(1);
    return;
  }
  const teamId =
    availableTeams[Math.floor(Math.random() * availableTeams.length)];

  const payload = JSON.stringify({
    teamId,
    email: `user${vuId}@example.com`,
    track,
    voteType: "standard",
    token: "", // use 'token' instead of 'captchaToken'
  });
  const headers = { "Content-Type": "application/json" };

  // http://localhost:3000/api/vote
  // https://voting-app-peach.vercel.app/api/vote

  const res = http.post(
    "https://voting-app-peach.vercel.app/api/vote",
    payload,
    { headers }
  );

  // Troubleshooting: log request and response if not 200
  if (res.status !== 200) {
    logRequestAndResponse(payload, res);
  }

  voteDuration.add(res.timings.duration);
  voteSuccess.add(res.status === 200);

  const ok = check(res, {
    "status is 200": (r) => r.status === 200,
    "vote response contains success": (r) =>
      typeof r.body === "string" && r.body.includes("success"),
  });

  if (res.status === 200 && ok) {
    // Mark this team as voted for this track (for this VU only)
    state[track].push(teamId);
  } else if (
    res.status === 400 &&
    res.body &&
    res.body.includes("already voted")
  ) {
    // Over-voting or duplicate, do not reattempt
    state[track].push(teamId); // treat as used for this VU
  }

  // If this VU has voted 2 times in all tracks, it will idle
  sleep(30);
}
