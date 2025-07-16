import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getTrackDisplayName, sanitizeTeamNameForSlug } from "@/lib/utils";
import VotingForm from "./voting-form";
import { Suspense, useState } from "react";
import { SkeletonBox, SkeletonSpinner } from "@/components/ui/skeleton";

interface VotePageProps {
  params: {
    slug: string;
  };
}

export default async function VotePage({ params }: VotePageProps) {
  // Find the team by matching the sanitized name
  const teams = await prisma.team.findMany();
  const team = teams.find(
    (t) => sanitizeTeamNameForSlug(t.name) === params.slug
  );

  if (!team) {
    notFound();
  }

  // Simulate loading state for demonstration (replace with actual loading logic if needed)
  // const [loading, setLoading] = useState(false);
  // if (loading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <SkeletonSpinner size="h-12 w-12" />
  //       <VotingForm loading />
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      {/* Logo at the very top, centered, outside the white box */}
      <div
        className="flex justify-center w-full"
        style={{ marginBottom: "10px" }}
      >
        <a
          href="https://hyperbyte.ai/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex justify-center"
        >
          <img
            src="/hyperbyte-logo.png"
            alt="Hyperbyte Logo"
            className="object-contain"
            style={{ width: "20%", maxWidth: "20%", height: "auto" }}
          />
        </a>
      </div>
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vote for</h1>
          <h2 className="text-2xl font-semibold text-indigo-600 mb-2">
            {team.name}
          </h2>
          <p className="text-gray-600">{getTrackDisplayName(team.track)}</p>
        </div>
        <VotingForm teamId={team.id} track={team.track} loading={false} />
      </div>
    </div>
  );
}
