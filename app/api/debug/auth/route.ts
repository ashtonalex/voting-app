import { type NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAdminPasswordHash } from "@/lib/env";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    // Get environment variables
    const envHash = process.env.ADMIN_PASSWORD_HASH;
    const helperHash = getAdminPasswordHash();
    const defaultHash =
      "$2a$12$eT/O.rISJtd4H7kD9rFefOCGvCohNbz07FThkGgEcJMTRfAR5.gge";

    // Test password against all hashes
    const tests = {
      // Environment info
      environment: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "Set" : "Not set",
        NODE_ENV: process.env.NODE_ENV,
      },

      // Password info
      password: {
        provided: password,
        length: password?.length,
        isExactMatch: password === "admin123",
        charCodes: Array.from(password || "").map((c) =>
          (c as string).charCodeAt(0)
        ),
      },

      // Hash comparisons
      hashes: {
        env: {
          hash: envHash,
          length: envHash?.length,
          isValid: envHash ? await bcrypt.compare(password, envHash) : false,
        },
        helper: {
          hash: helperHash,
          length: helperHash?.length,
          isValid: helperHash
            ? await bcrypt.compare(password, helperHash)
            : false,
        },
        default: {
          hash: defaultHash,
          length: defaultHash?.length,
          isValid: await bcrypt.compare(password, defaultHash),
        },
      },

      // Fresh hash test
      freshTest: {
        password: "admin123",
        hash: await bcrypt.hash("admin123", 12),
        isValid: await bcrypt.compare(
          "admin123",
          await bcrypt.hash("admin123", 12)
        ),
      },
    };

    return NextResponse.json(tests);
  } catch (error) {
    console.error("[DEBUG] Auth debug error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
