"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Track } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Download, Trash2, BarChart3 } from "lucide-react"
import { getTrackDisplayName } from "@/lib/utils"
import VoteChart from "./vote-chart"
import DeleteVoteDialog from "./delete-vote-dialog"
import Cookies from "js-cookie"
import { getCookieName } from "@/lib/utils"

interface Vote {
  id: string
  email: string
  teamId: string
  createdAt: string
  team: {
    id: string
    name: string
    track: Track
  }
}

interface VoteCount {
  teamId: string
  teamName: string
  track: Track
  count: number
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [votes, setVotes] = useState<Vote[]>([])
  const [voteCounts, setVoteCounts] = useState<VoteCount[]>([])
  const [totalVotes, setTotalVotes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    track: "",
    teamId: "",
    email: "",
  })
  const [deleteVoteId, setDeleteVoteId] = useState<string | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/admin/login")
      return
    }
    fetchVotes()
  }, [session, status, router])

  const fetchVotes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.track) params.append("track", filters.track)
      if (filters.teamId) params.append("teamId", filters.teamId)
      if (filters.email) params.append("email", filters.email)

      const response = await fetch(`/api/admin/votes?${params}`)
      const data = await response.json()

      if (response.ok) {
        setVotes(data.votes)
        setVoteCounts(data.voteCounts)
        setTotalVotes(data.totalVotes)
      }
    } catch (error) {
      console.error("Failed to fetch votes:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch("/api/admin/export")
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "votes.csv"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Failed to export votes:", error)
    }
  }

  const handleDeleteVote = async (voteId: string) => {
    try {
      const response = await fetch(`/api/admin/votes/${voteId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        const data = await response.json()
      
        if (data.email && data.track && typeof data.updatedCount === "number") {
          const cookieName = getCookieName(data.track)
          Cookies.set(cookieName, data.updatedCount.toString(), { expires: 30 })
        }
      
        fetchVotes()
        setDeleteVoteId(null)
      }
    } catch (error) {
      console.error("Failed to delete vote:", error)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  const trackOptions = Object.values(Track).map((track) => ({
    value: track,
    label: getTrackDisplayName(track),
  }))

  const teamOptions = Array.from(new Set(votes.map((vote) => vote.team))).map((team) => ({
    value: team.id,
    label: team.name,
  }))

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button onClick={handleExport} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Total Votes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalVotes}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Unique Voters</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{new Set(votes.map((vote) => vote.email)).size}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Teams with Votes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{new Set(votes.map((vote) => vote.teamId)).size}</p>
            </CardContent>
          </Card>
        </div>

        {/* Vote Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Votes by Team
            </CardTitle>
            <CardDescription>Visual representation of vote distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <VoteChart data={voteCounts} />
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                value={filters.track}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, track: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Track" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tracks</SelectItem>
                  {trackOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.teamId}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, teamId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teamOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Filter by email"
                value={filters.email}
                onChange={(e) => setFilters((prev) => ({ ...prev, email: e.target.value }))}
              />

              <Button onClick={fetchVotes}>Apply Filters</Button>
            </div>
          </CardContent>
        </Card>

        {/* Votes Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Votes</CardTitle>
            <CardDescription>
              {votes.length} vote{votes.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Team</th>
                    <th className="text-left p-2">Track</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {votes.map((vote) => (
                    <tr key={vote.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{vote.email}</td>
                      <td className="p-2">{vote.team.name}</td>
                      <td className="p-2">{getTrackDisplayName(vote.team.track)}</td>
                      <td className="p-2">{new Date(vote.createdAt).toLocaleDateString()}</td>
                      <td className="p-2">
                        <Button variant="destructive" size="sm" onClick={() => setDeleteVoteId(vote.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <DeleteVoteDialog
          isOpen={!!deleteVoteId}
          onClose={() => setDeleteVoteId(null)}
          onConfirm={() => deleteVoteId && handleDeleteVote(deleteVoteId)}
        />
      </div>
    </div>
  )
}
