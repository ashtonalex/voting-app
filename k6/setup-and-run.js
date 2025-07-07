#!/usr/bin/env node

const http = require("http");
const https = require("https");
const { spawn } = require("child_process");

// Configuration
const DEFAULT_BASE_URL = "https://voting-app-peach.vercel.app";
const DEFAULT_API_ENDPOINT = "/api/vote";
const HEALTH_ENDPOINT = "/api/health";

function testEndpoint(url, timeout = 5000) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === "https:" ? https : http;

    const req = client.get(url, { timeout }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({
          success: true,
          status: res.statusCode,
          body: data,
          headers: res.headers,
        });
      });
    });

    req.on("error", (error) => {
      resolve({
        success: false,
        error: error.message,
        code: error.code,
      });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({
        success: false,
        error: "Request timeout",
        code: "TIMEOUT",
      });
    });
  });
}

async function checkServer(baseUrl) {
  console.log(`🔍 Testing connection to ${baseUrl}...`);

  // Test health endpoint
  const healthResult = await testEndpoint(`${baseUrl}${HEALTH_ENDPOINT}`);
  if (healthResult.success) {
    console.log(`✅ Health check passed: ${healthResult.status}`);
    try {
      const healthData = JSON.parse(healthResult.body);
      console.log(`   Status: ${healthData.status}`);
      console.log(`   Uptime: ${Math.round(healthData.uptime)}s`);
    } catch (e) {
      console.log(`   Response: ${healthResult.body.substring(0, 100)}...`);
    }
  } else {
    console.log(
      `❌ Health check failed: ${healthResult.error} (${healthResult.code})`
    );
  }

  // Test vote endpoint
  const voteResult = await testEndpoint(`${baseUrl}${DEFAULT_API_ENDPOINT}`);
  if (voteResult.success) {
    console.log(`✅ Vote endpoint accessible: ${voteResult.status}`);
  } else {
    console.log(
      `❌ Vote endpoint failed: ${voteResult.error} (${voteResult.code})`
    );
  }

  return healthResult.success && voteResult.success;
}

function runK6Test(baseUrl, options = {}) {
  const env = {
    ...process.env,
    BASE_URL: baseUrl,
    API_ENDPOINT: options.apiEndpoint || DEFAULT_API_ENDPOINT,
    TEAM_IDS_PATH: options.teamIdsPath || "team-ids.json",
    CONNECTION_TIMEOUT: options.connectionTimeout || "10s",
    REQUEST_TIMEOUT: options.requestTimeout || "30s",
  };

  console.log("\n🚀 Starting k6 load test...");
  console.log(`   Base URL: ${baseUrl}`);
  console.log(`   API Endpoint: ${env.API_ENDPOINT}`);
  console.log(`   Team IDs: ${env.TEAM_IDS_PATH}`);
  console.log(`   Connection Timeout: ${env.CONNECTION_TIMEOUT}`);
  console.log(`   Request Timeout: ${env.REQUEST_TIMEOUT}`);

  const k6Process = spawn("k6", ["run", "ramping-arrival-rate-test.js"], {
    cwd: __dirname,
    env,
    stdio: "inherit",
  });

  k6Process.on("close", (code) => {
    console.log(`\n📊 k6 test completed with exit code: ${code}`);
    if (code === 0) {
      console.log("✅ Load test completed successfully");
    } else {
      console.log("❌ Load test failed");
    }
  });

  k6Process.on("error", (error) => {
    console.error(`❌ Failed to start k6: ${error.message}`);
    console.log("\n💡 Make sure k6 is installed and available in your PATH");
    console.log(
      "   Download from: https://k6.io/docs/getting-started/installation/"
    );
  });
}

async function main() {
  const args = process.argv.slice(2);
  const baseUrl = args[0] || DEFAULT_BASE_URL;

  console.log("🔧 k6 Load Test Setup and Runner");
  console.log("================================\n");

  // Check if server is running
  const serverOk = await checkServer(baseUrl);

  if (!serverOk) {
    console.log("\n❌ Server connection failed!");
    console.log("\n🔧 Troubleshooting steps:");
    console.log("1. Make sure your Next.js server is running:");
    console.log("   npm run dev");
    console.log("   # or");
    console.log("   yarn dev");
    console.log("   # or");
    console.log("   pnpm dev");
    console.log("\n2. Check if the server is running on the correct port");
    console.log(`   Expected: ${baseUrl}`);
    console.log("\n3. Verify the API endpoints exist:");
    console.log(`   - ${baseUrl}${HEALTH_ENDPOINT}`);
    console.log(`   - ${baseUrl}${DEFAULT_API_ENDPOINT}`);
    console.log("\n4. If using a different port, run:");
    console.log(`   node setup-and-run.js http://localhost:YOUR_PORT`);
    return;
  }

  console.log("\n✅ Server is ready for load testing!");

  // Ask user if they want to proceed
  if (args.includes("--auto")) {
    runK6Test(baseUrl);
  } else {
    console.log("\n🤔 Do you want to start the load test now? (y/n)");
    process.stdin.once("data", (data) => {
      const answer = data.toString().trim().toLowerCase();
      if (answer === "y" || answer === "yes") {
        runK6Test(baseUrl);
      } else {
        console.log("\n👋 Exiting. Run the script again when ready.");
        process.exit(0);
      }
    });
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkServer, runK6Test };
