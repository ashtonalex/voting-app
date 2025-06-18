import bcrypt from "bcryptjs"

async function testPassword() {
  const newHash = "$2a$12$eT/O.rISJtd4H7kD9rFefOCGvCohNbz07FThkGgEcJMTRfAR5.gge"
  
  console.log("Testing password validation with updated hash...")
  console.log("New hash:", newHash)
  
  // Test "admin123" against the new hash
  const testPassword = "admin123"
  
  const newHashValid = await bcrypt.compare(testPassword, newHash)
  
  console.log(`"${testPassword}" against new hash: ${newHashValid}`)
  
  // Generate a new hash for "admin123" to see what it should be
  const freshHash = await bcrypt.hash(testPassword, 12)
  console.log(`Fresh hash for "${testPassword}": ${freshHash}`)
  
  // Test some common variations
  const variations = ["admin", "Admin123", "ADMIN123", "admin123!", "admin123 "]
  for (const variation of variations) {
    const isValid = await bcrypt.compare(variation, newHash)
    console.log(`"${variation}" against new hash: ${isValid}`)
  }
}

testPassword().catch(console.error) 