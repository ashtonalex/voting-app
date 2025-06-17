"use client"

import { useState, useEffect, useCallback } from "react"
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

export default function VotingForm({ teamId, track }: VotingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [voteCount, setVoteCount] = useState(0)
  const [turnstileToken, setTurnstileToken] = useState("")
  const [turnstileLoaded, setTurnstileLoaded] = useState(false)
  const [widgetId, setWidgetId] = useState<string>("")

  const cookieName = getCookieName(track)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<VoteFormData>({
    resolver: zodResolver(voteSchema),
  })

  const initializeTurnstile = useCallback(() => {
    console.log("Initializing Turnstile, widgetId:", widgetId)
    console.log("window.turnstile exists:", !!window.turnstile)
    
    if (window.turnstile && !widgetId) {
      try {
        const id = window.turnstile.render("#turnstile-container", {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA",
          callback: (token: string) => {
            console.log("Turnstile callback received token:", token)
            setTurnstileToken(token)
          },
          "error-callback": () => {
            console.error("Turnstile error occurred")
            setTurnstileToken("")
          },
          "expired-callback": () => {
            console.log("Turnstile token expired")
            setTurnstileToken("")
          },
          theme: "light",
          size: "normal",
        })
        console.log("Turnstile widget created with ID:", id)
        setWidgetId(id)
        setTurnstileLoaded(true)
      } catch (error) {
        console.error("Failed to initialize Turnstile:", error)
        // In development, we'll skip Turnstile
        if (process.env.NODE_ENV === "development") {
          console.log("Development mode: Setting development token")
          setTurnstileToken("development-token")
          setTurnstileLoaded(true)
        }
      }
    }
  }, [widgetId])

  useEffect(() => {
    // Check existing vote count from cookies
    const existingCount = Number.parseInt(Cookies.get(cookieName) || "0")
    setVoteCount(existingCount)

    // Load Turnstile script
    const loadTurnstile = () => {
      if (document.querySelector('script[src*="turnstile"]')) {
        initializeTurnstile()
        return
      }

      const script = document.createElement("script")
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js"
      script.async = true
      script.defer = true
      script.onload = () => {
        initializeTurnstile()
      }
      script.onerror = () => {
        console.error("Failed to load Turnstile script")
        // In development, we'll skip Turnstile
        if (process.env.NODE_ENV === "development") {
          setTurnstileToken("development-token")
          setTurnstileLoaded(true)
        }
      }
      document.head.appendChild(script)
    }

    loadTurnstile()

    return () => {
      // Cleanup Turnstile widget on unmount
      if (window.turnstile && widgetId) {
        try {
          window.turnstile.remove(widgetId)
        } catch (error) {
          console.error("Error removing Turnstile widget:", error)
        }
      }
    }
  }, [cookieName, initializeTurnstile, widgetId])

  const resetTurnstile = useCallback(() => {
    if (window.turnstile && widgetId) {
      try {
        window.turnstile.reset(widgetId)
        setTurnstileToken("")
      } catch (error) {
        console.error("Error resetting Turnstile:", error)
      }
    }
  }, [widgetId])

  const onSubmit = async (data: VoteFormData) => {
    console.log("Form submitted with data:", data)
    console.log("Current vote count:", voteCount)
    console.log("Turnstile token:", turnstileToken)
    
    if (voteCount >= 2) {
      setErrorMessage("You have already voted 2 times for this track")
      setSubmitStatus("error")
      return
    }

    if (!turnstileToken) {
      setErrorMessage("Please complete the verification")
      setSubmitStatus("error")
      return
    }

    setIsSubmitting(true)
    setSubmitStatus("idle")
    setErrorMessage("")

    try {
      const requestBody = {
        ...data,
        teamId,
        turnstileToken,
      }
      console.log("Sending request to /api/vote:", requestBody)
      
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      console.log("Response status:", response.status)
      const result = await response.json()
      console.log("Response result:", result)

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit vote")
      }

      // Update cookie with new vote count
      const newCount = result.voteCount
      Cookies.set(cookieName, newCount.toString(), { expires: 30 })
      setVoteCount(newCount)

      setSubmitStatus("success")
      reset()

      // Reset Turnstile
      resetTurnstile()
    } catch (error) {
      console.error("Error submitting vote:", error)
      setErrorMessage(error instanceof Error ? error.message : "Failed to submit vote")
      setSubmitStatus("error")
      resetTurnstile()
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="email">Email Address</Label>
        <Input id="email" type="email" {...register("email")} className="mt-1" placeholder="your.email@example.com" />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Verification</Label>
        <div id="turnstile-container" className="flex justify-center">
          {!turnstileLoaded && (
            <div className="flex items-center justify-center p-4 border border-gray-200 rounded">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-gray-600">Loading verification...</span>
            </div>
          )}
        </div>
        {process.env.NODE_ENV === "development" && !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
          <p className="text-xs text-gray-500">Development mode: Turnstile verification is simulated</p>
        )}
      </div>

      {submitStatus === "success" && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Vote submitted successfully! You can vote {2 - voteCount} more time{2 - voteCount !== 1 ? "s" : ""} for this
            track.
          </AlertDescription>
        </Alert>
      )}

      {submitStatus === "error" && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={isSubmitting || (!turnstileToken && turnstileLoaded)} className="w-full">
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
  )
}
