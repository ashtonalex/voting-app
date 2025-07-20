"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Track } from "@prisma/client";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { voteSchema, type VoteFormData } from "@/lib/validations";
import { getVotesByTrackCookieName } from "@/lib/utils";
import { SkeletonBox } from "@/components/ui/skeleton";

interface VotingFormProps {
  teamId: string;
  track: Track;
  loading?: boolean;
}

declare global {
  interface Window {
    turnstileCallback?: (token: string) => void;
  }
}

const VOTE_LIMIT_PER_TRACK = 2;

export default function VotingForm({
  teamId,
  track,
  loading = false,
}: VotingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [votesForTrack, setVotesForTrack] = useState<string[]>([]);
  const [hasVotedForThisTeam, setHasVotedForThisTeam] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!;
  const votesByTrackCookieName = getVotesByTrackCookieName(track);

  const votesRemaining = VOTE_LIMIT_PER_TRACK - votesForTrack.length;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<VoteFormData>({
    resolver: zodResolver(voteSchema),
  });

  const CAPTCHA_ENABLED = process.env.NEXT_PUBLIC_CAPTCHA_ENABLED === "true";

  useEffect(() => {
    // Read the cookie for this track
    let votes: string[] = [];
    try {
      const cookieVal = Cookies.get(votesByTrackCookieName);
      if (cookieVal) {
        votes = JSON.parse(cookieVal);
      }
    } catch {}
    setVotesForTrack(Array.isArray(votes) ? votes : []);
    setHasVotedForThisTeam(votes.includes(teamId));

    if (CAPTCHA_ENABLED && typeof window !== "undefined" && !window.turnstile) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    if (CAPTCHA_ENABLED) {
      window.turnstileCallback = (token: string) => {
        setCaptchaToken(token);
      };
    }
  }, [votesByTrackCookieName, teamId]);

  // Helper to refresh votes from cookie
  function refreshVotesForTrack() {
    let votes: string[] = [];
    try {
      const cookieVal = Cookies.get(votesByTrackCookieName);
      if (cookieVal) {
        votes = JSON.parse(cookieVal);
      }
    } catch {}
    setVotesForTrack(Array.isArray(votes) ? votes : []);
    setHasVotedForThisTeam(votes.includes(teamId));
  }

  const onSubmit = async (data: VoteFormData) => {
    if (hasVotedForThisTeam) {
      setErrorMessage("You have already voted for this team in this track");
      setSubmitStatus("error");
      return;
    }
    if (votesForTrack.length >= VOTE_LIMIT_PER_TRACK) {
      setErrorMessage("You have already used all your votes for this track");
      setSubmitStatus("error");
      return;
    }
    if (CAPTCHA_ENABLED && !captchaToken) {
      setErrorMessage("Please complete the CAPTCHA");
      setSubmitStatus("error");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          teamId,
          ...(CAPTCHA_ENABLED ? { token: captchaToken } : {}),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit vote");
      }

      // Update the cookie for this track
      const updatedVotes = [...votesForTrack, teamId];
      Cookies.set(votesByTrackCookieName, JSON.stringify(updatedVotes), {
        expires: 30,
      });
      // Instead of optimistic update, re-read the cookie and update state
      refreshVotesForTrack();
      setSubmitStatus("success");
      reset();
      setCaptchaToken(null);
      window.turnstile?.reset?.();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to submit vote"
      );
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user has voted for this team, show persistent success message
  if (hasVotedForThisTeam) {
    // Use the latest votes array from state, but if just submitted, ensure the count is correct
    let votesCount = votesForTrack.includes(teamId)
      ? votesForTrack.length
      : votesForTrack.length + 1;
    let votesLeft = VOTE_LIMIT_PER_TRACK - votesCount;
    if (votesLeft < 0) votesLeft = 0;
    return (
      <>
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="space-y-2">
              <p className="font-semibold">✅ Vote submitted!</p>
              <p>Thank you for participating in the voting process.</p>
              <p className="text-sm">
                Votes remaining for this track: {votesLeft}
              </p>
            </div>
          </AlertDescription>
        </Alert>
        <div className="flex justify-center mt-3">
          <div className="border border-blue-300 rounded-lg px-4 py-3 bg-white shadow-sm hover:shadow-md transition-shadow duration-150">
            <a
              href="https://www.jotform.com/build/251951156648060"
              target="_blank"
              rel="noopener noreferrer"
              className="text-base font-semibold text-blue-700 hover:text-blue-900 transition-colors duration-150 focus:outline-none cursor-pointer"
            >
              Join Hyperbyte’s AI Mastery program on 9-10 August 2025!
            </a>
          </div>
        </div>
      </>
    );
  }

  // If user has used all votes for this track, show disabled state
  if (votesForTrack.length >= VOTE_LIMIT_PER_TRACK) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You have already used all your votes for this track. Thank you for
          your participation!
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonBox height="h-8" width="w-2/3" className="mb-4" />
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <SkeletonBox height="h-5" width="w-1/2" className="mb-2" />
          <SkeletonBox height="h-4" width="w-2/3" />
        </div>
        <div className="space-y-4">
          <SkeletonBox height="h-5" width="w-1/3" />
          <SkeletonBox height="h-10" width="w-full" />
          <SkeletonBox height="h-10" width="w-full" />
          <SkeletonBox height="h-10" width="w-full" />
        </div>
        <SkeletonBox height="h-10" width="w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">
          Important Voting Instructions
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>
              You are allowed <strong>2 votes per track</strong>
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>
              You can <strong>only vote once per team</strong>
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>
              All votes are <strong>final</strong> and cannot be cancelled or
              edited after submission
            </span>
          </li>
        </ul>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            className="mt-1"
            placeholder="your.email@example.com"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* CAPTCHA */}
        {CAPTCHA_ENABLED && (
          <div
            className="cf-turnstile"
            data-sitekey={siteKey}
            data-callback="turnstileCallback"
          />
        )}

        <Button
          type="submit"
          disabled={isSubmitting || (CAPTCHA_ENABLED && !captchaToken)}
          className="w-full"
        >
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
          Votes remaining for this track: {votesRemaining}
        </p>
      </form>

      {submitStatus === "error" && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
