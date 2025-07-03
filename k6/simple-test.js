import http from "k6/http";
import { check, sleep } from "k6";

// Configurable base URL
const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

// Just a few test team IDs - these will fail with 404 but we can see the pattern
const testTeamIds = [
  "clmcmvcqesjw26vqknj9e000",
  "clmcmvcqeskhrinstl2k001", 
  "clmcmvcqesr09wdh9eoka002"
];

export const options = {
  vus: 3,
  duration: "10s",
};

export default function () {
  // Pick a random team ID
  const teamId = testTeamIds[Math.floor(Math.random() * testTeamIds.length)];
  
  const payload = JSON.stringify({
    teamId: teamId,
    email: `test_user_${__VU}@example.com`,
  });
  
  const headers = { "Content-Type": "application/json" };
  const res = http.post(`${BASE_URL}/api/vote`, payload, { headers });
  
  console.log(`User ${__VU}: Status ${res.status}, Team ${teamId}`);
  
  check(res, {
    "status is 404 (team not found)": (r) => r.status === 404,
    "status is 200 (success)": (r) => r.status === 200,
    "status is 400 (validation error)": (r) => r.status === 400,
  });
  
  sleep(1);
}

export function setup() {
  console.log("Starting simple test with 3 users for 10 seconds");
  console.log(`Using BASE_URL: ${BASE_URL}`);
  console.log("Expected: 404 errors (teams don't exist)");
} 