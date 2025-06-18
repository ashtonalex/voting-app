import { env } from "../lib/env"
import bcrypt from "bcryptjs"

async function checkAuth() {
  console.log("\n=== NextAuth Configuration Check ===\n")
  
  // Check NEXTAUTH_URL
  console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL)
  if (!process.env.NEXTAUTH_URL) {
    console.log("❌ NEXTAUTH_URL is not set!")
  }
  
  // Check NEXTAUTH_SECRET
  console.log("\nNEXTAUTH_SECRET:", process.env.NEXTAUTH_SECRET ? "Set" : "Not set")
  if (!process.env.NEXTAUTH_SECRET) {
    console.log("❌ NEXTAUTH_SECRET is not set!")
  }
  
  // Check ADMIN_PASSWORD_HASH
  const adminHash = process.env.ADMIN_PASSWORD_HASH
  console.log("\nADMIN_PASSWORD_HASH:", adminHash)
  console.log("Hash length:", adminHash?.length ?? 0)
  
  if (adminHash) {
    try {
      // Test the hash with known password
      const isValid = await bcrypt.compare("admin123", adminHash)
      console.log("Test validation result:", isValid)
      
      // Generate a fresh hash for comparison
      const freshHash = await bcrypt.hash("admin123", 12)
      console.log("\nFresh hash for 'admin123':", freshHash)
      const freshValid = await bcrypt.compare("admin123", freshHash)
      console.log("Fresh hash validation:", freshValid)
    } catch (error) {
      console.error("Error testing hash:", error)
    }
  } else {
    console.log("❌ ADMIN_PASSWORD_HASH is not set!")
  }
  
  console.log("\n=== Environment Validation ===\n")
  console.log("Validated env object:", env)
}

checkAuth().catch(console.error) 