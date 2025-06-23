"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Track } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Download, Trash2, BarChart3 } from "lucide-react";
import { getTrackDisplayName } from "@/lib/utils";
import VoteChart from "./vote-chart";
import DeleteVoteDialog from "./delete-vote-dialog";
import Cookies from "js-cookie";
import { getCookieName } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface Vote {
  id: string;
  email: string;
  teamId: string;
  createdAt: string;
  team: {
    id: string;
    name: string;
    track: Track;
  };
}

interface VoteCount {
  teamId: string;
  teamName: string;
  track: Track;
  count: number;
  rank: number;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [votes, setVotes] = useState<Vote[]>([]);
  const [voteCounts, setVoteCounts] = useState<VoteCount[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    track: "",
    teamId: "",
    email: "",
  });
  const [deleteVoteId, setDeleteVoteId] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportTrack, setExportTrack] = useState<string>("all");
  const [exportTeam, setExportTeam] = useState<string>("all");
  const [exportMode, setExportMode] = useState<string>("log");

  const trackOptions = Object.values(Track).map((track) => ({
    value: track,
    label: getTrackDisplayName(track),
  }));

  const [selectedTrack, setSelectedTrack] = useState<Track>(
    trackOptions[0].value
  );

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/admin/login");
      return;
    }
    fetchVotes();
  }, [session, status, router]);

  const fetchVotes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.track) params.append("track", filters.track);
      if (filters.teamId) params.append("teamId", filters.teamId);
      if (filters.email) params.append("email", filters.email);

      const response = await fetch(`/api/admin/votes?${params}`);
      const data = await response.json();

      if (response.ok) {
        setVotes(data.votes);
        setVoteCounts(data.voteCounts);
        setTotalVotes(data.totalVotes);
      }
    } catch (error) {
      console.error("Failed to fetch votes:", error);
    } finally {
      setLoading(false);
    }
  };

  const sortedTopTeams = [...voteCounts]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Get top 3 teams for each track
  const topTeamsByTrack = voteCounts.reduce((acc, team) => {
    if (!acc[team.track]) {
      acc[team.track] = [];
    }
    acc[team.track].push(team);
    return acc;
  }, {} as Record<string, typeof voteCounts>);

  // Sort each track's teams and take top 3
  Object.keys(topTeamsByTrack).forEach((track) => {
    topTeamsByTrack[track] = topTeamsByTrack[track]
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  });

  const filteredExportTeamOptions = useMemo(() => {
    if (exportTrack && exportTrack !== "all") {
      const teams = votes
        .filter((vote) => vote.team.track === exportTrack)
        .map((vote) => vote.team)
        .filter(
          (team, idx, arr) => arr.findIndex((t) => t.id === team.id) === idx
        ) as { id: string; name: string }[];
      return teams.map((team) => ({ value: team.id, label: team.name }));
    } else {
      const teams = Array.from(new Set(votes.map((vote) => vote.team))) as {
        id: string;
        name: string;
      }[];
      return teams.map((team) => ({ value: team.id, label: team.name }));
    }
  }, [exportTrack, votes]);

  const handleExport = async (
    track?: string,
    teamId?: string,
    mode: string = "log"
  ) => {
    try {
      const params = new URLSearchParams();
      if (track && track !== "all") params.append("track", track);
      if (teamId && teamId !== "all") params.append("teamId", teamId);
      if (mode) params.append("mode", mode);
      const response = await fetch(`/api/admin/export?${params}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      let filename = "votes.csv";
      if (track && track !== "all" && teamId && teamId !== "all") {
        filename = `votes_track-${track}_team-${teamId}.csv`;
      } else if (track && track !== "all") {
        filename = `votes_track-${track}.csv`;
      } else if (teamId && teamId !== "all") {
        filename = `votes_team-${teamId}.csv`;
      }
      if (mode === "counts") {
        filename = filename.replace("votes", "vote-counts");
      }
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to export votes:", error);
    }
  };

  const handleDeleteVote = async (voteId: string) => {
    try {
      const response = await fetch(`/api/admin/votes/${voteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const data = await response.json();

        if (data.email && data.track && typeof data.updatedCount === "number") {
          const cookieName = getCookieName(data.track);
          Cookies.set(cookieName, data.updatedCount.toString(), {
            expires: 30,
          });
        }

        fetchVotes();
        setDeleteVoteId(null);
      }
    } catch (error) {
      console.error("Failed to delete vote:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const teamOptions = Array.from(new Set(votes.map((vote) => vote.team))).map(
    (team) => ({
      value: team.id,
      label: team.name,
    })
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-2">
            <Button
              onClick={() => handleExport()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export All CSV
            </Button>
            <AlertDialog
              open={exportDialogOpen}
              onOpenChange={setExportDialogOpen}
            >
              <AlertDialogTrigger asChild>
                <Button className="flex items-center gap-2" variant="default">
                  <Download className="h-4 w-4" />
                  Export Filtered CSV
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Export Filtered Votes</AlertDialogTitle>
                  <AlertDialogDescription>
                    Select filters and export mode for the vote data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <label className="block mb-1 font-medium">
                      Export Mode
                    </label>
                    <Select value={exportMode} onValueChange={setExportMode}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="log">Vote Entry Log</SelectItem>
                        <SelectItem value="counts">
                          Vote Counts Per Team
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Track</label>
                    <Select
                      value={exportTrack}
                      onValueChange={(value) => {
                        setExportTrack(value);
                        setExportTeam("all");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Tracks" />
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
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Team</label>
                    <Select
                      value={exportTeam}
                      onValueChange={setExportTeam}
                      disabled={filteredExportTeamOptions.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Teams" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Teams</SelectItem>
                        {filteredExportTeamOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setExportDialogOpen(false);
                      handleExport(exportTrack, exportTeam, exportMode);
                    }}
                  >
                    Export CSV
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
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
              <p className="text-3xl font-bold">
                {new Set(votes.map((vote) => vote.email)).size}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Teams with Votes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {new Set(votes.map((vote) => vote.teamId)).size}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Vote Chart with Track Selector */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Votes by Team
            </CardTitle>
            <CardDescription>
              Visual representation of vote distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Track selection dropdown */}
            <div className="mb-4 max-w-xs">
              <Select
                value={selectedTrack}
                onValueChange={(value) => setSelectedTrack(value as Track)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Track" />
                </SelectTrigger>
                <SelectContent>
                  {trackOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <VoteChart data={voteCounts} selectedTrack={selectedTrack} />
          </CardContent>
        </Card>

        {/* Ranked Teams */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Team Rankings
            </CardTitle>
            <CardDescription>Teams ranked by vote count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Rank</th>
                    <th className="text-left p-2">Team Name</th>
                    <th className="text-left p-2">Track</th>
                    <th className="text-left p-2">Votes</th>
                  </tr>
                </thead>
                <tbody>
                  {voteCounts.map((team) => (
                    <tr key={team.teamId} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-bold">
                        {team.rank === 1 && "🥇"}
                        {team.rank === 2 && "🥈"}
                        {team.rank === 3 && "🥉"}
                        {team.rank > 3 && `#${team.rank}`}
                      </td>
                      <td className="p-2 font-semibold">{team.teamName}</td>
                      <td className="p-2">{getTrackDisplayName(team.track)}</td>
                      <td className="p-2 font-bold text-blue-600">
                        {team.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Top Teams by Track */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top 3 Teams by Track
            </CardTitle>
            <CardDescription>
              Leading teams in each track category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(topTeamsByTrack).map(([track, teams]) => (
                <div key={track} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 text-blue-600">
                    {getTrackDisplayName(track as Track)}
                  </h3>
                  <div className="space-y-2">
                    {teams.map((team, index) => (
                      <div
                        key={team.teamId}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">
                            {index === 0 && "🥇"}
                            {index === 1 && "🥈"}
                            {index === 2 && "🥉"}
                          </span>
                          <span className="font-medium">{team.teamName}</span>
                        </div>
                        <span className="font-bold text-blue-600">
                          {team.count} votes
                        </span>
                      </div>
                    ))}
                    {teams.length === 0 && (
                      <p className="text-gray-500 text-sm">No votes yet</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, track: value }))
                }
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
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, teamId: value }))
                }
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
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, email: e.target.value }))
                }
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
                      <td className="p-2">
                        {getTrackDisplayName(vote.team.track)}
                      </td>
                      <td className="p-2">
                        {new Date(vote.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteVoteId(vote.id)}
                        >
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
  );
}
