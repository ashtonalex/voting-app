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
}

export default function VoteChart({ data }: VoteChartProps) {
  const chartData = data.map((item) => ({
    name: `${item.rank}. ${item.teamName}`,
    votes: item.count,
    track: getTrackDisplayName(item.track),
    rank: item.rank,
  }));

  return (
    <div className="h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
          <YAxis />
          <Tooltip
            formatter={(value, name, props) => [
              `${value} votes (Rank #${props.payload.rank})`,
              props.payload.track,
            ]}
          />
          <Bar dataKey="votes" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
