@echo off
REM Soak Test Runner for Voting App (Windows)
REM This script runs a 15-minute soak test with 50 users

echo 🚀 Starting Voting App Soak Test
echo ==================================
echo Duration: 15 minutes
echo Users: 50 concurrent
echo Expected votes: max 200 total
echo Vote limit: 2-4 per user
echo.

REM Check if k6 is installed
k6 version >nul 2>&1
if errorlevel 1 (
    echo ❌ k6 is not installed. Please install k6 first:
    echo    https://k6.io/docs/getting-started/installation/
    pause
    exit /b 1
)

REM Check if the app is running
echo 🔍 Checking if the voting app is running...
curl -s http://localhost:3000 >nul 2>&1
if errorlevel 1 (
    echo ❌ Voting app is not running on http://localhost:3000
    echo    Please start the app first with: npm run dev
    pause
    exit /b 1
)

echo ✅ Voting app is running
echo.

REM Set environment variables
set TEAM_IDS_PATH=k6/team-ids.json

REM Create results directory
if not exist "k6\results" mkdir k6\results

REM Run the soak test
echo 🏃‍♂️ Starting soak test...
echo    This will run for 15 minutes with 50 users
echo    Press Ctrl+C to stop early
echo.

k6 run ^
    --out json=k6/results/soak-test-results.json ^
    --env TEAM_IDS_PATH=k6/team-ids.json ^
    k6/soak-test.js

echo.
echo ✅ Soak test completed!
echo 📊 Results saved to: k6/results/soak-test-results.json
echo.

REM Display summary if results file exists
if exist "k6\results\soak-test-results.json" (
    echo 📈 Test Summary:
    echo =================
    echo Check the results file for detailed metrics
    echo Key metrics to verify:
    echo   - Vote success rate should be ^> 95%%
    echo   - Vote blocking should be working (blocked votes ^> 0)
    echo   - Response times should be ^< 1s for 95%% of requests
    echo   - Error rate should be ^< 2%%
)

pause 