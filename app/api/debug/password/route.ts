import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getAdminPasswordHash } from "@/lib/env"

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    // Use our helper function to get the hash
    let adminPasswordHash: string
    try {
      adminPasswordHash = getAdminPasswordHash()
    } catch (e) {
      console.error("[DEBUG] Error getting admin password hash:", e)
      adminPasswordHash = ""
    }

    // Generate a fresh hash for comparison
    const freshHash = await bcrypt.hash("admin123", 12)
    const freshHashValid = await bcrypt.compare("admin123", freshHash)

    console.log("[DEBUG] Admin password hash:", adminPasswordHash)
    console.log("[DEBUG] Hash length:", adminPasswordHash?.length || 0)

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
    console.error("[DEBUG] Error in password debug endpoint:", error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      bcryptWorking: false,
    })
  }
}
