import http from "k6/http";
import { check, sleep, group } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";

// Load team IDs from JSON file
const teamData = JSON.parse(open(__ENV.TEAM_IDS_PATH || "k6/team-ids.json"));

// Group team IDs by track
const tracks = {};
for (const t of teamData) {
  if (!tracks[t.track]) tracks[t.track] = [];
  tracks[t.track].push(t.id);
}
const trackNames = Object.keys(tracks);
const teamIds = teamData.map((t) => t.id);

// Test configuration
export const options = {
  stages: [
    { duration: "1m", target: 100 }, // ramp-up
    { duration: "18m", target: 100 }, // steady
    { duration: "1m", target: 0 }, // ramp-down
  ],
  thresholds: {
    valid_vote_success: ["rate>0.995"],
    invalid_vote_rejection: ["rate==1.0"],
    http_req_duration: ["p(95)<500"],
    valid_vote_duration: ["p(95)<500"],
    invalid_vote_duration: ["p(95)<200"],
  },
};

// Custom metrics
const validVoteSuccess = new Rate("valid_vote_success");
const invalidVoteRejection = new Rate("invalid_vote_rejection");
const validVoteDuration = new Trend("valid_vote_duration");
const invalidVoteDuration = new Trend("invalid_vote_duration");
const duplicateVoteAttempts = new Counter("duplicate_vote_attempts");
const voteLimitAttempts = new Counter("vote_limit_attempts");
const malformedVoteAttempts = new Counter("malformed_vote_attempts");
const validVoteAttempts = new Counter("valid_vote_attempts");

// User state tracking
const vuState = {};

// Utility: random int in [min, max]
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Utility: pick random element
function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

// Generate invalid payloads
function generateInvalidPayload(userId) {
  const cases = [
    // Missing teamId
    () => ({ email: `user${userId}@example.com`, track: pick(trackNames) }),
    // Wrong data type for teamId
    () => ({
      teamId: 12345,
      email: `user${userId}@example.com`,
      track: pick(trackNames),
    }),
    // Invalid teamId
    () => ({
      teamId: "invalid_team",
      email: `user${userId}@example.com`,
      track: pick(trackNames),
    }),
    // Missing email
    () => ({ teamId: pick(teamIds), track: pick(trackNames) }),
    // Extra field
    () => ({
      teamId: pick(teamIds),
      email: `user${userId}@example.com`,
      track: pick(trackNames),
      foo: "bar",
    }),
    // Wrong type for track
    () => ({
      teamId: pick(teamIds),
      email: `user${userId}@example.com`,
      track: 123,
    }),
  ];
  return pick(cases)();
}

// Simulate QR scan delay (200-500ms)
function qrScanDelay() {
  sleep(randInt(200, 500) / 1000);
}

// Think time between actions (30-120s)
function thinkTime() {
  sleep(randInt(30, 120));
}

// Main test
export default function () {
  const userId = __VU;
  if (!vuState[userId]) {
    vuState[userId] = {
      totalVotes: 0,
      votes: {}, // { track: { teamId: count } }
    };
    for (const track of trackNames) {
      vuState[userId].votes[track] = {};
    }
  }
  const state = vuState[userId];

  // Assign behavior type for this iteration
  // 0: duplicate, 1: vote limit, 2: malformed, 3: normal
  const r = Math.random();
  let behavior;
  if (r < 0.3) behavior = "duplicate";
  else if (r < 0.5) behavior = "vote_limit";
  else if (r < 0.75) behavior = "malformed";
  else behavior = "normal";

  let payload, teamId, track, res, start, responseTime;

  if (behavior === "duplicate") {
    group("Duplicate Vote Attempt", function () {
      // Pick a track/team already voted for (if any), else fallback to normal
      const votedTracks = trackNames.filter(
        (t) => Object.keys(state.votes[t]).length > 0
      );
      if (votedTracks.length === 0) {
        behavior = "normal";
      } else {
        track = pick(votedTracks);
        teamId = pick(Object.keys(state.votes[track]));
        payload = JSON.stringify({
          teamId,
          email: `user${userId}@example.com`,
          track,
          voteType: "standard",
          token: "",
        });
        qrScanDelay();
        start = Date.now();
        res = http.post(
          "https://voting-app-peach.vercel.app/api/vote",
          payload,
          { headers: { "Content-Type": "application/json" } }
        );
        responseTime = Date.now() - start;
        duplicateVoteAttempts.add(1);
        console.log(
          `[DUPLICATE_VOTE] User: ${userId}, Team: ${teamId}, Track: ${track}, Previous votes for team: ${
            state.votes[track][teamId] || 0
          }, Response: ${res.status}`
        );
        invalidVoteDuration.add(responseTime);
        invalidVoteRejection.add(res.status !== 200);
        thinkTime();
        return;
      }
    });
  }

  if (behavior === "vote_limit") {
    group("Vote Limit Exceeded", function () {
      // Simulate user with 12 votes already
      if (state.totalVotes < 12) {
        // Fill up to 12 votes
        while (state.totalVotes < 12) {
          // Pick random track/team not yet voted for (max 2 per team per track)
          const availableTracks = trackNames.filter(
            (t) => Object.keys(state.votes[t]).length < 2
          );
          if (availableTracks.length === 0) break;
          track = pick(availableTracks);
          const availableTeams = tracks[track].filter(
            (id) => !state.votes[track][id]
          );
          if (availableTeams.length === 0) continue;
          teamId = pick(availableTeams);
          state.votes[track][teamId] = 1;
          state.totalVotes++;
        }
      }
      // Now attempt 13th vote
      const availableTracks = trackNames.filter(
        (t) => Object.keys(state.votes[t]).length < 2
      );
      if (availableTracks.length === 0) {
        // All tracks exhausted, fallback to normal
        behavior = "normal";
      } else {
        track = pick(availableTracks);
        const availableTeams = tracks[track].filter(
          (id) => !state.votes[track][id]
        );
        if (availableTeams.length === 0) {
          behavior = "normal";
        } else {
          teamId = pick(availableTeams);
          payload = JSON.stringify({
            teamId,
            email: `user${userId}@example.com`,
            track,
            voteType: "standard",
            token: "",
          });
          qrScanDelay();
          start = Date.now();
          res = http.post(
            "https://voting-app-peach.vercel.app/api/vote",
            payload,
            { headers: { "Content-Type": "application/json" } }
          );
          responseTime = Date.now() - start;
          voteLimitAttempts.add(1);
          console.log(
            `[VOTE_LIMIT_EXCEEDED] User: ${userId}, Current votes: ${state.totalVotes}, Attempted vote: ${payload}, Response: ${res.status}`
          );
          invalidVoteDuration.add(responseTime);
          invalidVoteRejection.add(res.status !== 200);
          thinkTime();
          return;
        }
      }
    });
  }

  if (behavior === "malformed") {
    group("Malformed Vote Data", function () {
      payload = generateInvalidPayload(userId);
      qrScanDelay();
      start = Date.now();
      res = http.post(
        "https://voting-app-peach.vercel.app/api/vote",
        JSON.stringify(payload),
        { headers: { "Content-Type": "application/json" } }
      );
      responseTime = Date.now() - start;
      malformedVoteAttempts.add(1);
      let errorType = "";
      if (res.status === 400) errorType = "BadRequest";
      else if (res.status === 422) errorType = "UnprocessableEntity";
      else if (res.status >= 500) errorType = "ServerError";
      else errorType = "Other";
      console.log(
        `[INVALID_DATA] User: ${userId}, Payload: ${JSON.stringify(
          payload
        )}, Error: ${errorType}, Response: ${res.status}`
      );
      invalidVoteDuration.add(responseTime);
      invalidVoteRejection.add(res.status !== 200);
      thinkTime();
      return;
    });
  }

  // Normal voting behavior
  if (behavior === "normal") {
    group("Valid Vote", function () {
      // Find tracks/teams this user can still vote for (max 2 per team per track, 12 total)
      if (state.totalVotes >= 12) {
        thinkTime();
        return;
      }
      const availableTracks = trackNames.filter(
        (t) => Object.keys(state.votes[t]).length < 2
      );
      if (availableTracks.length === 0) {
        thinkTime();
        return;
      }
      track = pick(availableTracks);
      const availableTeams = tracks[track].filter(
        (id) => !state.votes[track][id]
      );
      if (availableTeams.length === 0) {
        thinkTime();
        return;
      }
      teamId = pick(availableTeams);
      payload = JSON.stringify({
        teamId,
        email: `user${userId}@example.com`,
        track,
        voteType: "standard",
        token: "",
      });
      qrScanDelay();
      start = Date.now();
      res = http.post("https://voting-app-peach.vercel.app/api/vote", payload, {
        headers: { "Content-Type": "application/json" },
      });
      responseTime = Date.now() - start;
      validVoteAttempts.add(1);
      validVoteDuration.add(responseTime);
      validVoteSuccess.add(res.status === 200);
      if (res.status === 200) {
        // Update state
        state.votes[track][teamId] = 1;
        state.totalVotes++;
      }
      console.log(
        `[VALID_VOTE] User: ${userId}, Team: ${teamId}, Track: ${track}, Vote count: ${state.totalVotes}, Response time: ${responseTime}ms`
      );
      thinkTime();
      return;
    });
  }
}

// Handle summary
export function handleSummary(data) {
  return {
    stdout: `\nEDGE CASE TEST SUMMARY\n======================\nValid vote attempts: ${
      data.metrics.valid_vote_attempts.values.count
    }\nValid vote success rate: ${(
      data.metrics.valid_vote_success.values.rate * 100
    ).toFixed(2)}%\nDuplicate vote attempts: ${
      data.metrics.duplicate_vote_attempts.values.count
    }\nVote limit violation attempts: ${
      data.metrics.vote_limit_attempts.values.count
    }\nMalformed vote attempts: ${
      data.metrics.malformed_vote_attempts.values.count
    }\nInvalid vote rejection rate: ${(
      data.metrics.invalid_vote_rejection.values.rate * 100
    ).toFixed(2)}%\n`,
  };
}
