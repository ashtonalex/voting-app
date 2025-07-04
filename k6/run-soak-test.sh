#!/bin/bash

# Soak Test Runner for Voting App
# This script runs a 15-minute soak test with 50 users

# Set BASE_URL for Vercel deployment
export BASE_URL="https://voting-app-peach.vercel.app"

# You can override BASE_URL by running:
# BASE_URL=https://your-other-url k6/run-soak-test.sh

echo "🚀 Starting Voting App Soak Test"
echo "=================================="
echo "Duration: 15 minutes"
echo "Users: 50 concurrent"
echo "Expected votes: max 200 total"
echo "Vote limit: 2-4 per user"
echo "Target BASE_URL: $BASE_URL"
echo ""

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo "❌ k6 is not installed. Please install k6 first:"
    echo "   https://k6.io/docs/getting-started/installation/"
    exit 1
fi

# Check if the app is running
echo "🔍 Checking if the voting app is running..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Voting app is not running on http://localhost:3000"
    echo "   Please start the app first with: npm run dev"
    exit 1
fi

echo "✅ Voting app is running"
echo ""

# Set environment variables
export TEAM_IDS_PATH="k6/team-ids.json"

# Create results directory
mkdir -p k6/results

# Run the soak test
echo "🏃‍♂️ Starting soak test..."
echo "   This will run for 15 minutes with 50 users"
echo "   Press Ctrl+C to stop early"
echo ""

k6 run \
    --out json=k6/results/soak-test-results.json \
    --env TEAM_IDS_PATH=k6/team-ids.json \
    --env BASE_URL=$BASE_URL \
    k6/soak-test.js

echo ""
echo "✅ Soak test completed!"
echo "📊 Results saved to: k6/results/soak-test-results.json"
echo ""

# Display summary if results file exists
if [ -f "k6/results/soak-test-results.json" ]; then
    echo "📈 Test Summary:"
    echo "================="
    echo "Check the results file for detailed metrics"
    echo "Key metrics to verify:"
    echo "  - Vote success rate should be > 95%"
    echo "  - Vote blocking should be working (blocked votes > 0)"
    echo "  - Response times should be < 1s for 95% of requests"
    echo "  - Error rate should be < 2%"
fi 