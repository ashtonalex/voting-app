const fetch = require("node-fetch").default;

async function testVote() {
  try {
    const response = await fetch("http://localhost:3000/api/vote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@example.com",
        teamId: "cmc0a5gtp0000ed4o11hwekyp", // Using one of the team IDs from our database
      }),
    });

    const result = await response.json();
    console.log("Status:", response.status);
    console.log("Response:", result);
  } catch (error) {
    console.error("Error:", error);
  }
}

testVote();
