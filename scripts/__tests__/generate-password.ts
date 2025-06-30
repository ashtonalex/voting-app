import bcrypt from "bcryptjs"

async function generatePassword() {
  const password = "admin123"
  const hash = await bcrypt.hash(password, 12)

  console.log("Password:", password)
  console.log("Generated hash:", hash)

  // Test the hash
  const isValid = await bcrypt.compare(password, hash)
  console.log("Hash validation test:", isValid)

  // Test against the current environment hash
  const currentHash = process.env.ADMIN_PASSWORD_HASH
  if (currentHash) {
    const isCurrentValid = await bcrypt.compare(password, currentHash)
    console.log("Current environment hash validation:", isCurrentValid)
  } else {
    console.log("No ADMIN_PASSWORD_HASH found in environment")
  }
}

generatePassword().catch(console.error)
