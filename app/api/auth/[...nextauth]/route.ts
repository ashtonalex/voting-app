import NextAuth from "next-auth"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { getAdminPasswordHash } from "@/lib/env"

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("Login attempt with password:", credentials?.password ? "provided" : "missing")

        if (!credentials?.password) {
          console.log("No password provided")
          return null
        }

        // Get admin password hash using our helper function
        const adminPasswordHash = getAdminPasswordHash()
        console.log("Using admin password hash of length:", adminPasswordHash.length)

        try {
          const isValid = await bcrypt.compare(credentials.password, adminPasswordHash)
          console.log("Password validation result:", isValid)

          if (isValid) {
            console.log("Login successful")
            return {
              id: "admin",
              email: "admin@voting-system.com",
              name: "Admin",
            }
          } else {
            console.log("Invalid password")
            return null
          }
        } catch (error) {
          console.error("Error during password comparison:", error)
          return null
        }
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
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
