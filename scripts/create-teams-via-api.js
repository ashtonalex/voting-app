// Create teams in the database via API calls
const BASE_URL = "https://voting-app-rouge.vercel.app";

// We'll use the team IDs we generated
const fs = require('fs');
const path = require('path');

async function createTeams() {
  console.log("🌱 Creating teams in the database...");
  
  // Read the generated team IDs
  const teamIdsPath = path.join(process.cwd(), "k6", "team-ids.json");
  const teamIdsData = JSON.parse(fs.readFileSync(teamIdsPath, 'utf-8'));
  
  console.log(`📋 Found ${teamIdsData.length} team IDs to create`);
  
  let successCount = 0;
  let errorCount = 0;
  
  // Create teams by making vote requests with each team ID
  for (let i = 0; i < teamIdsData.length; i++) {
    const teamId = teamIdsData[i].id;
    const track = teamIdsData[i].track;
    
    // Create a test vote to trigger team creation
    const payload = {
      teamId: teamId,
      email: `create-team-${i + 1}@test.com`
    };
    
    try {
      const response = await fetch(`${BASE_URL}/api/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (response.status === 404 && data.error === "Team not found") {
        console.log(`⚠️  Team ${teamId} not found - this is expected for new teams`);
        errorCount++;
      } else if (response.ok) {
        console.log(`✅ Successfully created team ${teamId} (${track})`);
        successCount++;
      } else {
        console.log(`❌ Error creating team ${teamId}: ${data.error}`);
        errorCount++;
      }
      
      // Small delay between requests to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.log(`❌ Network error for team ${teamId}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Team Creation Summary:`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📝 Note: 404 errors are expected for new teams that don't exist yet`);
  
  if (successCount > 0) {
    console.log(`\n🎉 Successfully created ${successCount} teams!`);
    console.log("🚀 You can now run the soak test.");
  } else {
    console.log(`\n⚠️  No teams were created. The database might need manual seeding.`);
  }
}

createTeams(); 