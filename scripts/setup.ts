import { execSync } from "child_process"
import fs from "fs"
import path from "path"

async function setup() {
  console.log("🚀 Setting up Voting System...")

  // Check if .env.local exists
  const envPath = path.join(process.cwd(), ".env.local")
  if (!fs.existsSync(envPath)) {
    console.log("📝 Creating .env.local file...")
    const envContent = `# Database
DATABASE_URL="postgresql://username:password@localhost:5432/voting_system"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Admin password (bcrypt hash of "admin123" - change in production)
ADMIN_PASSWORD_HASH="$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm"

# Cloudflare Turnstile (optional for development)
TURNSTILE_SECRET_KEY="development-key"
NEXT_PUBLIC_TURNSTILE_SITE_KEY="development-key"
`
    fs.writeFileSync(envPath, envContent)
    console.log("✅ Created .env.local file")
  }

  try {
    console.log("📦 Installing dependencies...")
    execSync("npm install", { stdio: "inherit" })

    console.log("🗄️  Generating Prisma client...")
    execSync("npx prisma generate", { stdio: "inherit" })

    console.log("✅ Setup complete!")
    console.log("\n📋 Next steps:")
    console.log("1. Update DATABASE_URL in .env.local with your database connection string")
    console.log("2. Run 'npx prisma db push' to create database tables")
    console.log("3. Run 'npm run db:seed' to add sample data")
    console.log("4. Run 'npm run dev' to start the development server")
  } catch (error) {
    console.error("❌ Setup failed:", error)
    process.exit(1)
  }
}

setup()
