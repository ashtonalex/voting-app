"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Track } from "@prisma/client";
import { getTrackDisplayName } from "@/lib/utils";

interface VoteCount {
  teamId: string;
  teamName: string;
  track: Track;
  count: number;
  rank: number;
}

interface VoteChartProps {
  data: VoteCount[];
  selectedTrack: Track;
}

// Assign a unique color for each track
const TRACK_COLORS: Record<Track, string> = {
  AI_INNOVATION_PREU: "#6366f1", // Indigo
  AI_ART_PREU: "#f59e42", // Orange
  AI_TECHNICAL_PREU: "#10b981", // Emerald
  AI_INNOVATION_UPPERSEC: "#f43f5e", // Rose
  AI_ART_UPPERSEC: "#3b82f6", // Blue
  AI_TECHNICAL_UPPERSEC: "#a21caf", // Purple
};

export default function VoteChart({ data, selectedTrack }: VoteChartProps) {
  // Filter data for the selected track
  const filteredData = data.filter((item) => item.track === selectedTrack);
  const chartData = filteredData.map((item) => ({
    name: `${item.rank}. ${item.teamName}`,
    votes: item.count,
    track: getTrackDisplayName(item.track),
    rank: item.rank,
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-gray-500">
        No votes for this track yet.
      </div>
    );
  }

  return (
    <div className="h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
            tick={{ fontSize: 12 }}
          />
          <YAxis tick={{ fontSize: 14 }} />
          <Tooltip
            formatter={(value, name, props) => [
              `${value} votes (Rank #${props.payload.rank})`,
              props.payload.track,
            ]}
          />
          <Bar
            dataKey="votes"
            fill={TRACK_COLORS[selectedTrack]}
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
