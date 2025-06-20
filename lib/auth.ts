import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { getAdminPasswordHash } from "./env"

// Debug: Log the environment hash at module level
const adminHash = getAdminPasswordHash()
console.log("[AUTH] Environment hash from helper:", adminHash)
console.log("[AUTH] Environment hash length:", adminHash.length)

export const authOptions: NextAuthOptions = {
  debug: true,  // Enable NextAuth debug logging
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("[AUTH] Starting authorization...")
        console.log("[AUTH] Raw credentials:", JSON.stringify(credentials))
        
        if (!credentials?.password) {
          console.log("[AUTH] No password provided")
          return null
        }

        // Get the admin password hash using our helper
        const adminPasswordHash = getAdminPasswordHash()

        // Debug logs
        console.log("[AUTH] Password entered (JSON):", JSON.stringify(credentials.password))
        console.log("[AUTH] Password entered (raw):", credentials.password)
        console.log("[AUTH] Password length:", credentials.password.length)
        console.log("[AUTH] Password bytes:", Array.from(credentials.password).map(c => c.charCodeAt(0)))
        console.log("[AUTH] Hash used:", adminPasswordHash)
        console.log("[AUTH] Hash length:", adminPasswordHash.length)
        
        try {
          // Test with exact string comparison first
          console.log("[AUTH] Password matches 'admin123':", credentials.password === "admin123")
          
          // Generate a fresh hash for comparison
          const freshHash = await bcrypt.hash("admin123", 12)
          const freshHashValid = await bcrypt.compare("admin123", freshHash)
          console.log("[AUTH] Fresh hash test:", freshHashValid)

          // Test the actual password
          const isValid = await bcrypt.compare(credentials.password, adminPasswordHash)
          console.log("[AUTH] Password validation result:", isValid)

          // Also test against a known good hash
          const testHash = "$2a$12$eT/O.rISJtd4H7kD9rFefOCGvCohNbz07FThkGgEcJMTRfAR5.gge"
          const testValid = await bcrypt.compare(credentials.password, testHash)
          console.log("[AUTH] Test hash validation:", testValid)

          if (isValid) {
            const user = {
              id: "admin",
              email: "admin@voting-system.com",
              name: "Admin",
            }
            console.log("[AUTH] Returning user:", user)
            return user
          }
        } catch (error) {
          console.error("[AUTH] Error during password validation:", error)
        }

        console.log("[AUTH] Authorization failed")
        return null
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log("[AUTH] JWT Callback - Token:", token, "User:", user)
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      console.log("[AUTH] Session Callback - Session:", session, "Token:", token)
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "development-secret-key",
}
