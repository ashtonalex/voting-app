import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";
import {
  randomSeed,
  randomItem,
  randomIntBetween,
} from "https://jslib.k6.io/k6-utils/1.4.0/index.js";

// Configuration - can be overridden via environment variables
const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const API_ENDPOINT = __ENV.API_ENDPOINT || "/api/vote";
const CONNECTION_TIMEOUT = __ENV.CONNECTION_TIMEOUT || "10s";
const REQUEST_TIMEOUT = __ENV.REQUEST_TIMEOUT || "30s";

// Load team IDs and tracks
const teamData = JSON.parse(open(__ENV.TEAM_IDS_PATH || "team-ids.json"));
const tracks = {};
for (const t of teamData) {
  if (!tracks[t.track]) tracks[t.track] = [];
  tracks[t.track].push(t.id);
}
const trackNames = Object.keys(tracks);

// Scenario weights
const SCENARIOS = [
  { type: "valid", weight: 75 },
  { type: "duplicate", weight: 15 },
  { type: "limit", weight: 7 },
  { type: "malformed", weight: 3 },
];
const SCENARIO_WEIGHTS = SCENARIOS.flatMap((s) => Array(s.weight).fill(s.type));

// Voting limits
const MAX_TOTAL_VOTES = 12;
const MAX_PER_TEAM_PER_TRACK = 2;

// Custom metrics
const voteDuration = new Trend("vote_duration");
const voteSuccess = new Rate("vote_success");
const duplicateRejection = new Rate("duplicate_rejection");
const malformedRejection = new Rate("malformed_rejection");
const limitRejection = new Rate("limit_rejection");
const saturationPoint = new Counter("system_saturation");
const coldStartCount = new Counter("serverless_cold_starts");
const dbErrorCount = new Counter("db_connection_errors");
const connectionErrorCount = new Counter("connection_errors");
const timeoutErrorCount = new Counter("timeout_errors");

// VU state
const vuState = {};

export const options = {
  scenarios: {
    voting_ramp: {
      executor: "ramping-arrival-rate",
      startRate: 0,
      timeUnit: "1m",
      preAllocatedVUs: 50,
      maxVUs: 2000,
      stages: [
        { target: 200, duration: "5m" }, // 0-5 min: ramp to 200 req/min
        { target: 600, duration: "5m" }, // 5-10 min: ramp to 600 req/min
        { target: 600, duration: "15m" }, // 10-25 min: hold at 600 req/min
        { target: 1000, duration: "10m" }, // 25-35 min: ramp to 1000 req/min
        { target: 1000, duration: "10m" }, // 35-45 min: hold at 1000 req/min
        { target: 0, duration: "5m" }, // 45-50 min: ramp down to 0
      ],
    },
  },
  thresholds: {
    vote_duration: ["p(95)<3000"], // 95% < 3s
    vote_success: ["rate>0.90"], // >90% success
    duplicate_rejection: ["rate>0.10"], // at least 10% duplicate rejections (expected)
    http_req_failed: ["rate<0.10"], // <10% error rate
    connection_errors: ["count<100"], // <100 connection errors
    timeout_errors: ["count<50"], // <50 timeout errors
  },
};

function getAuthToken(vuId) {
  // Simulate a static or random token for demo; replace with real if needed
  return `test-token-${vuId}`;
}

function pickScenario() {
  return randomItem(SCENARIO_WEIGHTS);
}

function getVUState(vuId) {
  if (!vuState[vuId]) {
    vuState[vuId] = {
      votes: [], // {teamId, track}
      perTrack: {},
      totalVotes: 0,
    };
    for (const track of trackNames) {
      vuState[vuId].perTrack[track] = {};
    }
  }
  return vuState[vuId];
}

function makeValidVote(vuId, state) {
  // Find a track/team not yet voted max times
  const availableTracks = trackNames.filter((track) => {
    const perTeam = state.perTrack[track];
    return (
      Object.values(perTeam).reduce((a, b) => a + b, 0) <
      MAX_PER_TEAM_PER_TRACK * tracks[track].length
    );
  });
  if (availableTracks.length === 0) return makeLimitVote(vuId, state); // fallback
  const track = randomItem(availableTracks);
  const perTeam = state.perTrack[track];
  const availableTeams = tracks[track].filter(
    (teamId) => (perTeam[teamId] || 0) < MAX_PER_TEAM_PER_TRACK
  );
  if (availableTeams.length === 0) return makeLimitVote(vuId, state); // fallback
  const teamId = randomItem(availableTeams);
  return {
    teamId,
    track,
    email: `user${vuId}@example.com`,
    voteType: "standard",
    token: getAuthToken(vuId),
  };
}

function makeDuplicateVote(vuId, state) {
  // Pick a team/track already voted for
  const voted = [];
  for (const track of trackNames) {
    for (const teamId in state.perTrack[track]) {
      if (state.perTrack[track][teamId] > 0) voted.push({ teamId, track });
    }
  }
  if (voted.length === 0) return makeValidVote(vuId, state); // fallback
  return {
    ...randomItem(voted),
    email: `user${vuId}@example.com`,
    voteType: "standard",
    token: getAuthToken(vuId),
  };
}

function makeLimitVote(vuId, state) {
  // Try to vote for a team/track already at max
  const overVoted = [];
  for (const track of trackNames) {
    for (const teamId of tracks[track]) {
      if ((state.perTrack[track][teamId] || 0) >= MAX_PER_TEAM_PER_TRACK) {
        overVoted.push({ teamId, track });
      }
    }
  }
  if (overVoted.length === 0) return makeValidVote(vuId, state); // fallback
  return {
    ...randomItem(overVoted),
    email: `user${vuId}@example.com`,
    voteType: "standard",
    token: getAuthToken(vuId),
  };
}

function makeMalformedVote(vuId, state) {
  // Randomly break the payload
  const base = makeValidVote(vuId, state);
  const malformed = [
    {},
    { teamId: 123 },
    { email: null, track: null },
    { teamId: base.teamId, track: base.track },
    { teamId: base.teamId, email: base.email },
    { teamId: base.teamId, track: base.track, email: base.email },
    { teamId: base.teamId, track: base.track, email: base.email, voteType: 42 },
    { teamId: "", track: "", email: "", voteType: "", token: "" },
  ];
  return randomItem(malformed);
}

function logMonitoring(res, payload, scenario, vuId) {
  // Cold start detection (Vercel: x-vercel-id header, high latency, etc)
  if (
    res.headers["x-vercel-id"] &&
    res.headers["x-vercel-id"].includes("cold")
  ) {
    coldStartCount.add(1);
  }
  // DB error detection (example: error message in body)
  if (
    res.body &&
    typeof res.body === "string" &&
    res.body.match(/db|prisma|connection/i)
  ) {
    dbErrorCount.add(1);
  }
  // System saturation: 503, 429, or high latency
  if ([429, 503].includes(res.status) || res.timings.duration > 5000) {
    saturationPoint.add(1);
  }
  // Log scenario and status for debugging
  if (res.status !== 200) {
    console.error(
      JSON.stringify({
        scenario,
        vuId,
        payload,
        status: res.status,
        body: res.body,
        headers: res.headers,
        timestamp: new Date().toISOString(),
      })
    );
  }
}

// Connection test function
function testConnection() {
  const testUrl = `${BASE_URL}/api/health`;
  try {
    const res = http.get(testUrl, { timeout: "5s" });
    return res.status === 200;
  } catch (error) {
    return false;
  }
}

export default function () {
  const vuId = __VU;
  const state = getVUState(vuId);

  // Test connection on first iteration of each VU
  if (__ITER === 0) {
    const isConnected = testConnection();
    if (!isConnected) {
      console.error(
        `[CONNECTION ERROR] VU ${vuId}: Cannot connect to ${BASE_URL}. Please ensure the server is running.`
      );
      connectionErrorCount.add(1);
      // Continue with the test but log the issue
    }
  }

  let scenario = pickScenario();
  let payloadObj;
  switch (scenario) {
    case "valid":
      payloadObj = makeValidVote(vuId, state);
      break;
    case "duplicate":
      payloadObj = makeDuplicateVote(vuId, state);
      break;
    case "limit":
      payloadObj = makeLimitVote(vuId, state);
      break;
    case "malformed":
      payloadObj = makeMalformedVote(vuId, state);
      break;
    default:
      payloadObj = makeValidVote(vuId, state);
  }
  const payload = JSON.stringify(payloadObj);
  const headers = { "Content-Type": "application/json" };
  const url = `${BASE_URL}${API_ENDPOINT}`;

  // Enhanced error handling for HTTP requests
  let res;
  try {
    res = http.post(url, payload, {
      headers,
      timeout: REQUEST_TIMEOUT,
      connectTimeout: CONNECTION_TIMEOUT,
    });
  } catch (error) {
    // Handle connection errors
    if (
      error.message.includes("connection refused") ||
      error.message.includes("connect")
    ) {
      connectionErrorCount.add(1);
      console.error(
        `[CONNECTION ERROR] VU ${vuId}: ${error.message}. URL: ${url}`
      );
      return; // Skip this iteration
    }
    // Handle timeout errors
    if (error.message.includes("timeout")) {
      timeoutErrorCount.add(1);
      console.error(
        `[TIMEOUT ERROR] VU ${vuId}: ${error.message}. URL: ${url}`
      );
      return; // Skip this iteration
    }
    // Handle other errors
    console.error(`[HTTP ERROR] VU ${vuId}: ${error.message}. URL: ${url}`);
    return; // Skip this iteration
  }

  voteDuration.add(res.timings.duration);
  voteSuccess.add(res.status === 200);

  // Custom metrics for rejection types
  if (
    scenario === "duplicate" &&
    res.status === 400 &&
    res.body &&
    res.body.match(/already voted|duplicate/i)
  ) {
    duplicateRejection.add(1);
  }
  if (scenario === "malformed" && res.status >= 400) {
    malformedRejection.add(1);
  }
  if (
    scenario === "limit" &&
    res.status === 400 &&
    res.body &&
    res.body.match(/limit|max/i)
  ) {
    limitRejection.add(1);
  }

  // Update VU state for valid votes
  if (scenario === "valid" && res.status === 200) {
    // Track per-team per-track
    state.perTrack[payloadObj.track][payloadObj.teamId] =
      (state.perTrack[payloadObj.track][payloadObj.teamId] || 0) + 1;
    state.totalVotes++;
  }

  logMonitoring(res, payloadObj, scenario, vuId);

  // Monitor VU allocation and arrival/execution rate
  if (__ITER % 100 === 0) {
    console.log(
      `[MONITOR] VU: ${__VU}, ITER: ${__ITER}, scenario: ${scenario}, res: ${res.status}, duration: ${res.timings.duration}ms, url: ${url}`
    );
  }

  // Simulate user think time
  sleep(randomIntBetween(1, 3));
}
