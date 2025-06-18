import dotenv from "dotenv"

// Load environment variables
dotenv.config()

console.log("Environment variables test:")
console.log("ADMIN_PASSWORD_HASH:", process.env.ADMIN_PASSWORD_HASH)
console.log("NEXTAUTH_SECRET:", process.env.NEXTAUTH_SECRET ? "Set" : "Not set")
console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL)
console.log("NODE_ENV:", process.env.NODE_ENV) 