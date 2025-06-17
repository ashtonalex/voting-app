import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Track } from "@prisma/client"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTrackDisplayName(track: Track): string {
  const trackNames = {
    AI_INNOVATION_PREU: "AI Innovation (Pre-University)",
    AI_ART_PREU: "AI Art (Pre-University)",
    AI_TECHNICAL_PREU: "AI Technical (Pre-University)",
    AI_INNOVATION_UPPERSEC: "AI Innovation (Upper Secondary)",
    AI_ART_UPPERSEC: "AI Art (Upper Secondary)",
    AI_TECHNICAL_UPPERSEC: "AI Technical (Upper Secondary)",
  }
  return trackNames[track]
}

export function getCookieName(track: Track): string {
  return `voted_${track.toLowerCase()}`
}

export async function verifyTurnstile(token: string): Promise<boolean> {
  // Skip verification in development if no secret key is provided or using test key
  const secretKey = process.env.TURNSTILE_SECRET_KEY
  if (
    !secretKey ||
    secretKey === "development-key" ||
    token === "development-token" ||
    process.env.NODE_ENV === "development"
  ) {
    console.log("Development mode: Skipping Turnstile verification")
    return true
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    })

    const data = await response.json()
    return data.success === true
  } catch (error) {
    console.error("Turnstile verification error:", error)
    // In development, return true on error
    if (process.env.NODE_ENV === "development") {
      return true
    }
    return false
  }
}
