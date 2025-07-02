# Voting App Soak Test with k6

This directory contains scripts to run a soak test on your voting app using [k6](https://k6.io/).

## Test Overview
- **Users:** 50
- **Votes per user:** Random between 2 and 4
- **Max votes per run:** 200
- **Duration:** ~15 minutes
- **Vote limit:** 2-4 per user (randomized)
- **Metrics:** Vote success, vote blocking, response time
- **Database queries:** Minimized to avoid quota issues

## How to Run

### Prerequisites
- [k6 installed](https://k6.io/docs/getting-started/installation/)
- Voting app running locally at http://localhost:3000
- `k6/team-ids.json` file with team IDs

### Linux/Mac
```sh
chmod +x k6/run-soak-test.sh
./k6/run-soak-test.sh
```

### Windows
```bat
k6\run-soak-test.bat
```

### Manual k6 Command
```sh
k6 run --env TEAM_IDS_PATH=k6/team-ids.json k6/soak-test.js
```

## What to Expect
- Each user will vote 2-4 times (randomly assigned)
- Total votes will not exceed 200
- The test will run for about 15 minutes
- Metrics will be saved to `k6/results/soak-test-results.json`
- Console output will show summary and blocking effectiveness

## Key Metrics
- **Vote success rate** should be > 95%
- **Vote blocking** should be working (blocked votes > 0)
- **Response times** should be < 1s for 95% of requests
- **Error rate** should be < 2%

## Troubleshooting
- Make sure k6 is installed and in your PATH
- Make sure the voting app is running at http://localhost:3000
- Make sure `k6/team-ids.json` exists and is valid

---

Feel free to modify the test parameters in `soak-test.js` to fit your needs! 