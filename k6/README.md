# k6 Load Testing Setup

This directory contains k6 load testing scripts for the voting system API.

## 🚀 Quick Start

### 1. Start Your Next.js Server

First, make sure your Next.js development server is running:

```bash
# From the project root
npm run dev
# or
yarn dev
# or
pnpm dev
```

Your server should be running on `http://localhost:3000` by default.

### 2. Test Connection

Use the setup script to verify your server is ready:

```bash
# From the k6 directory
node setup-and-run.js
```

This will:

- Test connectivity to your server
- Verify the health endpoint (`/api/health`)
- Verify the vote endpoint (`/api/vote`)
- Provide troubleshooting guidance if needed

### 3. Run Load Test

#### Option A: Using the setup script (Recommended)

```bash
# Interactive mode
node setup-and-run.js

# Auto-start mode
node setup-and-run.js --auto

# Custom server URL
node setup-and-run.js http://localhost:4000
```

#### Option B: Direct k6 command

```bash
# Basic run
k6 run ramping-arrival-rate-test.js

# With custom configuration
k6 run --env BASE_URL=http://localhost:3000 --env API_ENDPOINT=/api/vote ramping-arrival-rate-test.js
```

## 📋 Configuration

### Environment Variables

You can customize the test behavior using environment variables:

| Variable             | Default                 | Description             |
| -------------------- | ----------------------- | ----------------------- |
| `BASE_URL`           | `http://localhost:3000` | Base URL of your server |
| `API_ENDPOINT`       | `/api/vote`             | API endpoint to test    |
| `TEAM_IDS_PATH`      | `team-ids.json`         | Path to team IDs file   |
| `CONNECTION_TIMEOUT` | `10s`                   | Connection timeout      |
| `REQUEST_TIMEOUT`    | `30s`                   | Request timeout         |

### Example Custom Configuration

```bash
k6 run \
  --env BASE_URL=https://your-production-url.com \
  --env API_ENDPOINT=/api/vote \
  --env CONNECTION_TIMEOUT=5s \
  --env REQUEST_TIMEOUT=15s \
  ramping-arrival-rate-test.js
```

## 📊 Test Scenarios

The load test includes multiple scenarios:

- **Valid Votes (75%)**: Normal voting behavior
- **Duplicate Votes (15%)**: Attempting to vote for the same team/track
- **Limit Votes (7%)**: Attempting to exceed voting limits
- **Malformed Votes (3%)**: Invalid payloads to test error handling

## 🔧 Troubleshooting

### Connection Refused Error

If you see `connection refused` errors:

1. **Check if server is running:**

   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Verify the correct port:**

   - Default: `http://localhost:3000`
   - If using a different port, update the URL

3. **Check for firewall/antivirus blocking connections**

### Database Connection Errors

If you see Prisma database errors:

1. **Check your `.env` file:**

   ```bash
   DATABASE_URL="postgresql://accelerate.prisma-data.net/?api_key=..."
   ```

2. **Verify network connectivity:**

   ```bash
   # Windows
   Test-NetConnection accelerate.prisma-data.net -Port 5432

   # Mac/Linux
   nc -vz accelerate.prisma-data.net 5432
   ```

3. **Try a different network** (some networks block port 5432)

### File Not Found Errors

If you see file not found errors:

1. **Make sure you're in the correct directory:**

   ```bash
   cd k6
   ```

2. **Verify `team-ids.json` exists:**
   ```bash
   ls -la team-ids.json
   ```

## 📈 Metrics

The test tracks several metrics:

- **vote_duration**: Response time for vote requests
- **vote_success**: Success rate of votes
- **connection_errors**: Number of connection failures
- **timeout_errors**: Number of timeout failures
- **duplicate_rejection**: Expected duplicate vote rejections
- **malformed_rejection**: Expected malformed vote rejections
- **limit_rejection**: Expected limit violation rejections

## 🎯 Performance Thresholds

The test includes performance thresholds:

- 95% of requests should complete in < 3 seconds
- Success rate should be > 90%
- Connection errors should be < 100
- Timeout errors should be < 50

## 📁 Files

- `ramping-arrival-rate-test.js`: Main k6 load test script
- `setup-and-run.js`: Helper script for testing and running
- `team-ids.json`: Team data for the load test
- `README.md`: This documentation

## 🔄 Test Stages

The load test runs in 6 stages over 50 minutes:

1. **0-5 min**: Ramp to 200 requests/minute
2. **5-10 min**: Ramp to 600 requests/minute
3. **10-25 min**: Hold at 600 requests/minute
4. **25-35 min**: Ramp to 1000 requests/minute
5. **35-45 min**: Hold at 1000 requests/minute
6. **45-50 min**: Ramp down to 0

## 🛠️ Development

### Adding New Scenarios

To add new test scenarios:

1. Add the scenario type to the `SCENARIOS` array
2. Create a `make[ScenarioName]Vote` function
3. Add the case to the switch statement in the main function

### Modifying Load Patterns

To change the load pattern, modify the `stages` array in the `options` object.

### Custom Metrics

To add custom metrics:

1. Create a new metric using k6's metric constructors
2. Add it to the thresholds if needed
3. Update the metric in your test logic
