import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH
    const defaultHash = "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm"

    // Generate a fresh hash for comparison
    const freshHash = await bcrypt.hash("admin123", 12)
    const freshHashValid = await bcrypt.compare("admin123", freshHash)

    const result = {
      providedPassword: password,
      hasEnvironmentHash: !!adminPasswordHash,
      environmentHashLength: adminPasswordHash?.length || 0,
      defaultHashValid: adminPasswordHash ? await bcrypt.compare(password, adminPasswordHash) : false,
      freshHashGenerated: freshHash,
      freshHashValid,
      bcryptWorking: true,
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      bcryptWorking: false,
    })
  }
}
