import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";

// Configurable base URL
const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

// Load team IDs from JSON file
const teamIds = JSON.parse(open(__ENV.TEAM_IDS_PATH || "k6/team-ids.json"));

// Custom metrics for detailed monitoring
const voteDuration = new Trend("vote_duration");
const voteSuccess = new Rate("vote_success");
const voteBlocked = new Counter("vote_blocked");

export const options = {
  stages: [
    { duration: "30s", target: 50 }, // Ramp up to 50 users
    { duration: "14m", target: 50 }, // Hold for 14 minutes
    { duration: "30s", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<1000"],
    http_req_failed: ["rate<0.02"],
    vote_success: ["rate>0.95"],
    vote_blocked: ["count>0"],
  },
};

// User state management
const userStates = new Map();

function getRandomVoteCount() {
  // Each user votes 2-4 times
  return Math.floor(Math.random() * 3) + 2; // 2, 3, or 4
}

function initializeUserState() {
  const userId = __VU;
  if (!userStates.has(userId)) {
    userStates.set(userId, {
      email: `soak_user_${userId}@test.com`,
      votesToSubmit: getRandomVoteCount(),
      votesSubmitted: 0,
      blockedVotes: 0,
      successfulVotes: 0,
      teamHistory: new Set(),
    });
  }
  return userStates.get(userId);
}

function submitVote(userState) {
  // Pick a random team the user hasn't voted for yet
  let teamIdObj;
  let attempts = 0;
  do {
    teamIdObj = teamIds[Math.floor(Math.random() * teamIds.length)];
    attempts++;
  } while (userState.teamHistory.has(teamIdObj.id) && attempts < 10);
  userState.teamHistory.add(teamIdObj.id);

  const payload = JSON.stringify({
    teamId: teamIdObj.id,
    email: userState.email,
  });
  const headers = { "Content-Type": "application/json" };
  const res = http.post(`${BASE_URL}/api/vote`, payload, { headers });
  voteDuration.add(res.timings.duration);

  let responseData = {};
  try {
    responseData = JSON.parse(res.body);
  } catch (e) {}

  if (res.status === 200 && responseData.success) {
    userState.votesSubmitted++;
    userState.successfulVotes++;
    voteSuccess.add(true);
  } else if (
    res.status === 400 &&
    responseData.error &&
    (responseData.error.includes("already voted") ||
      responseData.error.includes("voted 2 times"))
  ) {
    userState.blockedVotes++;
    voteBlocked.add(1);
    voteSuccess.add(false);
  } else {
    voteSuccess.add(false);
  }
  sleep(Math.random() * 3 + 2); // 2-5 seconds between votes
}

export default function () {
  const userState = initializeUserState();
  if (userState.votesSubmitted < userState.votesToSubmit) {
    submitVote(userState);
  } else {
    // User finished their votes, sleep out the rest of the test
    sleep(60);
  }
}

export function setup() {
  console.log("Starting soak test: 50 users, each votes 2-4 times (max 200 votes)");
  console.log(`Using BASE_URL: ${BASE_URL}`);
}

export function teardown(data) {
  let totalVotes = 0;
  let totalBlocked = 0;
  let totalSuccessful = 0;
  for (const [userId, state] of userStates) {
    totalVotes += state.votesSubmitted;
    totalBlocked += state.blockedVotes;
    totalSuccessful += state.successfulVotes;
    console.log(`User ${userId}: ${state.successfulVotes} successful, ${state.blockedVotes} blocked`);
  }
  console.log(`Total votes submitted: ${totalVotes}`);
  console.log(`Total successful votes: ${totalSuccessful}`);
  console.log(`Total blocked votes: ${totalBlocked}`);
  console.log(`Vote blocking effectiveness: ${((totalBlocked / (totalSuccessful + totalBlocked)) * 100).toFixed(2)}%`);
} 