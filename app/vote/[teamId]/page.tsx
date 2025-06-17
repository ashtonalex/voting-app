import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { getTrackDisplayName } from "@/lib/utils"
import VotingForm from "./voting-form"

interface VotePageProps {
  params: {
    teamId: string
  }
}

export default async function VotePage({ params }: VotePageProps) {
  const team = await prisma.team.findUnique({
    where: { id: params.teamId },
  })

  if (!team) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vote for</h1>
          <h2 className="text-2xl font-semibold text-indigo-600 mb-2">{team.name}</h2>
          <p className="text-gray-600">{getTrackDisplayName(team.track)}</p>
        </div>

        <VotingForm teamId={team.id} track={team.track} />
      </div>
    </div>
  )
}
