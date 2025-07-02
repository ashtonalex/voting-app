import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate } from "k6/metrics";

// Load team IDs from JSON file
const teamIds = JSON.parse(open(__ENV.TEAM_IDS_PATH || "k6/team-ids.json"));

export const options = {
  stages: [
    { duration: "30s", target: 25 }, // ramp-up
    { duration: "1m", target: 100 }, // peak load
    { duration: "30s", target: 0 }, // ramp-down
  ],
  thresholds: {
    http_req_duration: ["p(95)<800"], // 95% of requests < 800ms
    http_req_failed: ["rate<0.05"], // < 5% failure rate
  },
};

const voteDuration = new Trend("vote_duration");
const voteSuccess = new Rate("vote_success");

export default function () {
  // Pick a random teamId for each request
  const teamId = teamIds[Math.floor(Math.random() * teamIds.length)];

  const payload = JSON.stringify({
    teamId,
    email: `user${__VU}_${__ITER}@example.com`,
    track: "AI Innovation",
    voteType: "standard",
    captchaToken: "", // optional if CAPTCHA is disabled
  });

  const headers = { "Content-Type": "application/json" };

  const res = http.post("http://localhost:3000/api/vote", payload, { headers });

  voteDuration.add(res.timings.duration);
  voteSuccess.add(res.status === 200);

  check(res, {
    "status is 200": (r) => r.status === 200,
    "vote response contains success": (r) =>
      typeof r.body === "string" && r.body.includes("success"),
  });

  // Log failed responses for debugging
  if (res.status !== 200) {
    console.log(`Status ${res.status}: ${res.body}`);
  }

  sleep(1); // pacing between requests
}