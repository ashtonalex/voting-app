// Fetch team IDs from Vercel deployment
const BASE_URL = "https://voting-app-rouge.vercel.app";

async function fetchTeamIds() {
  try {
    console.log("🔍 Fetching team IDs from Vercel deployment...");
    console.log(`Target URL: ${BASE_URL}/api/admin/votes`);
    
    // First, let's try to get teams from the admin API
    const response = await fetch(`${BASE_URL}/api/admin/votes?applyFilters=false`);
    
    if (!response.ok) {
      console.log(`❌ Admin API failed: ${response.status} ${response.statusText}`);
      
      // Try a simple test to see if the app is working
      const testResponse = await fetch(`${BASE_URL}/api/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: 'test-id',
          email: 'test@example.com'
        })
      });
      
      console.log(`Test response: ${testResponse.status}`);
      const testBody = await testResponse.text();
      console.log(`Test body: ${testBody}`);
      
      return;
    }
    
    const data = await response.json();
    console.log("✅ Successfully fetched data from admin API");
    
    // Extract unique teams from votes
    const teamsMap = new Map();
    if (data.votes && Array.isArray(data.votes)) {
      data.votes.forEach(vote => {
        if (vote.team && !teamsMap.has(vote.team.id)) {
          teamsMap.set(vote.team.id, {
            id: vote.team.id,
            track: vote.team.track,
            name: vote.team.name
          });
        }
      });
    }
    
    const teams = Array.from(teamsMap.values());
    
    if (teams.length === 0) {
      console.log("⚠️  No teams found in votes. The database might be empty.");
      console.log("💡 You may need to seed the database first.");
      return;
    }
    
    console.log(`✅ Found ${teams.length} teams:`);
    teams.forEach(team => {
      console.log(`  - ${team.name} (${team.track}): ${team.id}`);
    });
    
    // Create the team IDs array for k6
    const teamIdsForK6 = teams.map(team => ({
      id: team.id,
      track: team.track
    }));
    
    // Save to k6/team-ids.json
    const fs = require('fs');
    const path = require('path');
    const outputPath = path.join(process.cwd(), "k6", "team-ids.json");
    fs.writeFileSync(outputPath, JSON.stringify(teamIdsForK6, null, 2), "utf-8");
    
    console.log(`\n✅ Team IDs saved to: ${outputPath}`);
    console.log(`📊 Ready for soak testing with ${teams.length} teams`);
    
  } catch (error) {
    console.error("❌ Error fetching team IDs:", error);
  }
}

fetchTeamIds(); 