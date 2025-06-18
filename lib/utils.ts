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
