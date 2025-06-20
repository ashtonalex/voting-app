import { z } from "zod"
import bcrypt from "bcryptjs"

const bcryptHashRegex = /^\$2[abxy]\$\d{2}\$[A-Za-z0-9./]{53}$/

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  ADMIN_PASSWORD_HASH: z.string().regex(bcryptHashRegex, "Invalid bcrypt hash format"),
  TURNSTILE_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
})

// Helper function to get the admin password hash
export function getAdminPasswordHash(): string {
  const hash = process.env.ADMIN_PASSWORD_HASH
  if (!hash || !bcryptHashRegex.test(hash)) {
    console.error("[ENV] Invalid bcrypt hash format:", hash)
    // Return the default hash as fallback
    return "$2a$12$eT/O.rISJtd4H7kD9rFefOCGvCohNbz07FThkGgEcJMTRfAR5.gge"
  }
  return hash
}

// Load environment variables with validation
let validatedEnv;
try {
  validatedEnv = envSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  })
} catch (error) {
  console.error("[ENV] Environment validation failed:", error)
  // Use default values as fallback
  validatedEnv = {
    DATABASE_URL: process.env.DATABASE_URL || "",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "development-secret-key",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
    ADMIN_PASSWORD_HASH: "$2a$12$eT/O.rISJtd4H7kD9rFefOCGvCohNbz07FThkGgEcJMTRfAR5.gge",
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY || "",
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "",
  }
}

export const env = validatedEnv;
