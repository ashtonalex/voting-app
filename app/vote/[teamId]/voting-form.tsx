"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { Track } from "@prisma/client"
import Cookies from "js-cookie"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { voteSchema, type VoteFormData } from "@/lib/validations"
import { getCookieName } from "@/lib/utils"

interface VotingFormProps {
  teamId: string
  track: Track
}

declare global {
  interface Window {
    turnstileCallback?: (token: string) => void
  }
}

export default function VotingForm({ teamId, track }: VotingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [voteCount, setVoteCount] = useState(0)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!
  const cookieName = getCookieName(track)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<VoteFormData>({
    resolver: zodResolver(voteSchema),
  })

  useEffect(() => {
    const existingCount = Number.parseInt(Cookies.get(cookieName) || "0")
    setVoteCount(existingCount)

    if (typeof window !== "undefined" && !window.turnstile) {
      const script = document.createElement("script")
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js"
      script.async = true
      script.defer = true
      document.body.appendChild(script)
    }

    // ✅ Safe usage of setCaptchaToken in callback
    window.turnstileCallback = (token: string) => {
      setCaptchaToken(token)
    }
  }, [cookieName])

  const onSubmit = async (data: VoteFormData) => {
    if (voteCount >= 2) {
      setErrorMessage("You have already voted 2 times for this track")
      setSubmitStatus("error")
      return
    }

    if (!captchaToken) {
      setErrorMessage("Please complete the CAPTCHA")
      setSubmitStatus("error")
      return
    }

    setIsSubmitting(true)
    setSubmitStatus("idle")
    setErrorMessage("")

    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          teamId,
          token: captchaToken,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit vote")
      }

      const newCount = result.voteCount
      Cookies.set(cookieName, newCount.toString(), { expires: 30 })
      setVoteCount(newCount)
      setSubmitStatus("success")
      reset()
      setCaptchaToken(null)
      window.turnstile?.reset?.()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to submit vote")
      setSubmitStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (voteCount >= 2) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You have already voted 2 times for this track. Thank you for your participation!
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" type="email" {...register("email")} className="mt-1" placeholder="your.email@example.com" />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>

        {/* CAPTCHA */}
        <div
          className="cf-turnstile"
          data-sitekey={siteKey}
          data-callback="turnstileCallback"
        />

        <Button type="submit" disabled={isSubmitting || !captchaToken} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting Vote...
            </>
          ) : (
            "Submit Vote"
          )}
        </Button>

        <p className="text-sm text-gray-500 text-center">
          You can vote up to 2 times per track. Current votes: {voteCount}/2
        </p>
      </form>

      {submitStatus === "success" && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="space-y-2">
              <p className="font-semibold">🎉 Vote submitted successfully!</p>
              <p>Thank you for participating in the voting process.</p>
              <p>
                You can vote {2 - voteCount} more time{2 - voteCount !== 1 ? "s" : ""} for this track.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {submitStatus === "error" && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{errorMessage}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
