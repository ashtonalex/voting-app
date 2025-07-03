"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
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
import {
  Loader2,
  Download,
  Trash2,
  BarChart3,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
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
import Link from "next/link";
import {
  SkeletonBox,
  SkeletonText,
  SkeletonSpinner,
} from "@/components/ui/skeleton";
import VoteTimelineCard from "./vote-timeline-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@radix-ui/react-tabs";
import useSWR from "swr";

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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Real-time total votes fetcher
const totalVotesFetcher = async () => {
  const res = await fetch("/api/admin/votes");
  if (!res.ok) throw new Error("Failed to fetch total votes");
  const data = await res.json();
  if (typeof data.totalVotes !== "number") throw new Error("Invalid response");
  return data.totalVotes;
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [votes, setVotes] = useState<Vote[]>([]);
  const [voteCounts, setVoteCounts] = useState<VoteCount[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    track: "all",
    teamId: "all",
    email: "",
  });
  const [filteredVotes, setFilteredVotes] = useState<Vote[]>([]);
  const [deleteVoteId, setDeleteVoteId] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportTrack, setExportTrack] = useState<string>("all");
  const [exportTeam, setExportTeam] = useState<string>("all");
  const [exportMode, setExportMode] = useState<string>("log");
  const [emailSuggestionsOpen, setEmailSuggestionsOpen] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const trackOptions = Object.values(Track).map((track) => ({
    value: track,
    label: getTrackDisplayName(track),
  }));

  const [selectedTrack, setSelectedTrack] = useState<Track>(
    trackOptions[0].value
  );

  // Memoize unique teams grouped by track
  const teamsByTrack = useMemo(() => {
    const teams = votes.reduce((acc, vote) => {
      const { team } = vote;
      if (!acc[team.track]) {
        acc[team.track] = new Map();
      }
      if (!acc[team.track].has(team.id)) {
        acc[team.track].set(team.id, team);
      }
      return acc;
    }, {} as Record<Track, Map<string, Vote["team"]>>);

    return Object.entries(teams).reduce((acc, [track, teamsMap]) => {
      acc[track as Track] = Array.from(teamsMap.values());
      return acc;
    }, {} as Record<Track, Vote["team"][]>);
  }, [votes]);

  // Get available team options based on selected track
  const availableTeamOptions = useMemo(() => {
    if (filters.track === "all") return [];
    return (teamsByTrack[filters.track as Track] || []).map((team) => ({
      value: team.id,
      label: team.name,
    }));
  }, [filters.track, teamsByTrack]);

  // Unique emails from all votes
  const uniqueEmails = useMemo(() => {
    const set = new Set<string>();
    votes.forEach((vote) => set.add(vote.email));
    return Array.from(set);
  }, [votes]);

  // Filtered email suggestions
  const filteredEmailSuggestions = useMemo(() => {
    if (!filters.email.trim()) return [];
    return uniqueEmails
      .filter((email) =>
        email.toLowerCase().includes(filters.email.trim().toLowerCase())
      )
      .slice(0, 8); // Limit to 8 suggestions
  }, [filters.email, uniqueEmails]);

  // Handle track change
  const handleTrackChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      track: value,
      teamId: "all", // Reset team selection when track changes
    }));
  };

  // Handle team change
  const handleTeamChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      teamId: value,
    }));
  };

  // Handle email input focus/blur
  const handleEmailFocus = () => {
    if (filteredEmailSuggestions.length > 0) setEmailSuggestionsOpen(true);
  };
  const handleEmailBlur = () => {
    setTimeout(() => setEmailSuggestionsOpen(false), 100); // Delay to allow click
  };

  // Handle email input change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({
      ...prev,
      email: e.target.value,
    }));
    setHighlightedIndex(-1);
    if (e.target.value.trim() && filteredEmailSuggestions.length > 0) {
      setEmailSuggestionsOpen(true);
    } else {
      setEmailSuggestionsOpen(false);
    }
  };

  // Handle suggestion click
  const handleEmailSuggestionClick = (email: string) => {
    setFilters((prev) => ({ ...prev, email }));
    setEmailSuggestionsOpen(false);
    emailInputRef.current?.blur();
  };

  // Handle keyboard navigation
  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!emailSuggestionsOpen || filteredEmailSuggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((idx) =>
        Math.min(idx + 1, filteredEmailSuggestions.length - 1)
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((idx) => Math.max(idx - 1, 0));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleEmailSuggestionClick(filteredEmailSuggestions[highlightedIndex]);
    }
  };

  // Apply filters
  const handleApplyFilters = () => {
    fetchFilteredVotes(filters);
  };

  // Reset filters
  const handleResetFilters = () => {
    const resetFilters = {
      track: "all",
      teamId: "all",
      email: "",
    };
    setFilters(resetFilters);
    fetchFilteredVotes(resetFilters);
  };

  const fetchFilteredVotes = useCallback(
    async (currentFilters = filters) => {
      try {
        const params = new URLSearchParams();
        params.append("track", currentFilters.track);
        params.append("teamId", currentFilters.teamId);
        if (currentFilters.email.trim()) {
          params.append("email", currentFilters.email.trim());
        }
        params.append("applyFilters", "true");

        const response = await fetch(`/api/admin/votes?${params}`);
        const data = await response.json();

        if (response.ok) {
          setFilteredVotes(data.votes);
        }
      } catch (error) {
        console.error("Failed to fetch filtered votes:", error);
      }
    },
    [filters]
  );

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/admin/login");
      return;
    }
    fetchVotes();
    fetchFilteredVotes();
  }, [session, status, router, fetchFilteredVotes]);

  const fetchVotes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/votes?applyFilters=false`);
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
    let teams: { id: string; name: string }[] = [];
    if (exportTrack && exportTrack !== "all") {
      teams = votes
        .filter((vote) => vote.team.track === exportTrack)
        .map((vote) => vote.team);
    } else {
      teams = votes.map((vote) => vote.team);
    }
    // Deduplicate by team name, keeping the first occurrence
    const uniqueTeamsMap = new Map<string, { id: string; name: string }>();
    for (const team of teams) {
      if (!uniqueTeamsMap.has(team.name)) {
        uniqueTeamsMap.set(team.name, team);
      }
    }
    // Sort alphabetically by team name
    const uniqueTeams = Array.from(uniqueTeamsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    return uniqueTeams.map((team) => ({ value: team.id, label: team.name }));
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
        fetchFilteredVotes();
        setDeleteVoteId(null);
      }
    } catch (error) {
      console.error("Failed to delete vote:", error);
    }
  };

  const {
    data: dashboard,
    error: dashboardError,
    isLoading: dashboardLoading,
  } = useSWR("/api/admin/dashboard", fetcher);

  const {
    data: realTimeTotalVotes,
    error: totalVotesError,
    isLoading: totalVotesLoading,
  } = useSWR("/api/admin/votes", totalVotesFetcher, { refreshInterval: 10000 });

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
        <SkeletonSpinner size="h-12 w-12" className="mb-8" />
        <div className="w-full max-w-7xl space-y-8">
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-6 bg-white rounded-lg shadow">
                <SkeletonBox height="h-8" width="w-1/2" className="mb-4" />
                <SkeletonBox height="h-10" width="w-1/3" />
              </div>
            ))}
          </div>
          {/* Vote Chart Skeleton */}
          <div className="mb-8 p-6 bg-white rounded-lg shadow">
            <SkeletonBox height="h-6" width="w-1/3" className="mb-2" />
            <SkeletonBox height="h-4" width="w-1/4" className="mb-4" />
            <div className="h-96 w-full flex items-center justify-center">
              <SkeletonBox height="h-80" width="w-full" />
            </div>
          </div>
          {/* Top Teams by Track Skeleton */}
          <div className="mb-8 p-6 bg-white rounded-lg shadow">
            <SkeletonBox height="h-6" width="w-1/3" className="mb-2" />
            <SkeletonBox height="h-4" width="w-1/4" className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <SkeletonBox height="h-5" width="w-2/3" className="mb-3" />
                  <div className="space-y-2">
                    {[...Array(3)].map((_, j) => (
                      <div
                        key={j}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <SkeletonBox height="h-4" width="w-1/4" />
                        <SkeletonBox height="h-4" width="w-1/4" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Team Rankings Table Skeleton */}
          <div className="mb-8 p-6 bg-white rounded-lg shadow">
            <SkeletonBox height="h-6" width="w-1/3" className="mb-2" />
            <SkeletonBox height="h-4" width="w-1/4" className="mb-4" />
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
                  {[...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-2">
                        <SkeletonBox height="h-4" width="w-8" />
                      </td>
                      <td className="p-2">
                        <SkeletonBox height="h-4" width="w-24" />
                      </td>
                      <td className="p-2">
                        <SkeletonBox height="h-4" width="w-20" />
                      </td>
                      <td className="p-2">
                        <SkeletonBox height="h-4" width="w-10" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* All Votes Table Skeleton */}
          <div className="p-6 bg-white rounded-lg shadow">
            <SkeletonBox height="h-6" width="w-1/3" className="mb-2" />
            <SkeletonBox height="h-4" width="w-1/4" className="mb-4" />
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
                  {[...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-2">
                        <SkeletonBox height="h-4" width="w-32" />
                      </td>
                      <td className="p-2">
                        <SkeletonBox height="h-4" width="w-24" />
                      </td>
                      <td className="p-2">
                        <SkeletonBox height="h-4" width="w-20" />
                      </td>
                      <td className="p-2">
                        <SkeletonBox height="h-4" width="w-16" />
                      </td>
                      <td className="p-2">
                        <SkeletonBox height="h-4" width="w-10" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-2">
            <Button asChild className="font-semibold" variant="default">
              <Link href="/qr/production">View QR Codes (Production)</Link>
            </Button>
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
              {totalVotesLoading ? (
                <p className="text-3xl font-bold text-gray-400">...</p>
              ) : totalVotesError ? (
                <p className="text-red-500">Failed to load</p>
              ) : (
                <p className="text-3xl font-bold">{realTimeTotalVotes}</p>
              )}
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

        {/* Chart Section Tabs */}
        <Tabs defaultValue="timeline" className="w-full mb-8">
          <TabsList className="flex gap-2 bg-gray-100 rounded-lg p-1 mb-4">
            <TabsTrigger
              value="timeline"
              className="px-4 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow font-semibold"
            >
              Vote Timeline
            </TabsTrigger>
            <TabsTrigger
              value="team"
              className="px-4 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow font-semibold"
            >
              Votes by Team
            </TabsTrigger>
          </TabsList>
          <TabsContent value="timeline">
            <VoteTimelineCard timeSeries={dashboard?.timeSeries ?? []} />
          </TabsContent>
          <TabsContent value="team">
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between mb-4 gap-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    <CardTitle className="text-lg font-semibold">
                      Votes by Team
                    </CardTitle>
                  </div>
                  <div className="max-w-xs w-full">
                    <Select
                      value={selectedTrack}
                      onValueChange={(value) =>
                        setSelectedTrack(value as Track)
                      }
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
                </div>
                <CardDescription className="mb-2">
                  Visual representation of vote distribution by teams
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VoteChart data={voteCounts} selectedTrack={selectedTrack} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
              {voteCounts.length > 5 ? (
                <div className="max-h-80 overflow-y-auto">
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
                        <tr
                          key={team.teamId}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-2 font-bold">
                            {team.rank === 1 && "🥇"}
                            {team.rank === 2 && "🥈"}
                            {team.rank === 3 && "🥉"}
                            {team.rank > 3 && `#${team.rank}`}
                          </td>
                          <td className="p-2 font-semibold">{team.teamName}</td>
                          <td className="p-2">
                            {getTrackDisplayName(team.track)}
                          </td>
                          <td className="p-2 font-bold text-blue-600">
                            {team.count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
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
                      <tr
                        key={team.teamId}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-2 font-bold">
                          {team.rank === 1 && "🥇"}
                          {team.rank === 2 && "🥈"}
                          {team.rank === 3 && "🥉"}
                          {team.rank > 3 && `#${team.rank}`}
                        </td>
                        <td className="p-2 font-semibold">{team.teamName}</td>
                        <td className="p-2">
                          {getTrackDisplayName(team.track)}
                        </td>
                        <td className="p-2 font-bold text-blue-600">
                          {team.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Filters Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Votes</CardTitle>
            <CardDescription>Filter the votes table below</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Track</label>
                <Select value={filters.track} onValueChange={handleTrackChange}>
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
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Team</label>
                <Select
                  value={filters.teamId}
                  onValueChange={handleTeamChange}
                  disabled={filters.track === "all"}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        filters.track !== "all"
                          ? "Select Team"
                          : "Select Track First"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {availableTeamOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Input
                    ref={emailInputRef}
                    placeholder="Filter by email"
                    value={filters.email}
                    onChange={handleEmailChange}
                    onFocus={handleEmailFocus}
                    onBlur={handleEmailBlur}
                    onKeyDown={handleEmailKeyDown}
                    autoComplete="off"
                  />
                  {emailSuggestionsOpen &&
                    filteredEmailSuggestions.length > 0 && (
                      <ul className="absolute z-10 left-0 right-0 bg-white border border-gray-200 rounded shadow-md mt-1 max-h-48 overflow-y-auto">
                        {filteredEmailSuggestions.map((email, idx) => (
                          <li
                            key={email}
                            className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                              highlightedIndex === idx ? "bg-gray-100" : ""
                            }`}
                            onMouseDown={() =>
                              handleEmailSuggestionClick(email)
                            }
                            onMouseEnter={() => setHighlightedIndex(idx)}
                          >
                            {email}
                          </li>
                        ))}
                      </ul>
                    )}
                </div>
              </div>

              <div className="space-y-2 flex items-end gap-2">
                <Button onClick={handleApplyFilters} className="flex-1">
                  Apply Filters
                </Button>
                <Button onClick={handleResetFilters} variant="outline">
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Votes Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Votes</CardTitle>
            <CardDescription>
              {filteredVotes.length} vote{filteredVotes.length !== 1 ? "s" : ""}{" "}
              found
              {(filters.track !== "all" ||
                filters.teamId !== "all" ||
                filters.email) &&
                " (filtered)"}
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
              </table>
              {filteredVotes.length > 10 ? (
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full border-collapse">
                    <tbody>
                      {filteredVotes.map((vote) => (
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
              ) : (
                <table className="w-full border-collapse">
                  <tbody>
                    {filteredVotes.map((vote) => (
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
              )}
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
