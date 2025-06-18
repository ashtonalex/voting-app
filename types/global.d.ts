import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

export {}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string
      NEXTAUTH_SECRET: string
      NEXTAUTH_URL?: string
      ADMIN_PASSWORD_HASH?: string
    }
  }
}
