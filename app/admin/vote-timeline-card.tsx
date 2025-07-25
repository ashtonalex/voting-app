"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
  ReferenceDot,
} from "recharts";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { BarChart3 } from "lucide-react";

interface TimelinePoint {
  time: string;
  count: number;
}

interface VoteTimelineCardProps {
  timeSeries: TimelinePoint[];
}

export default function VoteTimelineCard({
  timeSeries,
}: VoteTimelineCardProps) {
  const [granularity, setGranularity] = useState<"hour" | "day">("hour");
  const [brushIndex, setBrushIndex] = useState<[number, number] | null>(null);

  // Optionally, support day granularity by grouping in JS
  const data = useMemo(() => {
    if (granularity === "hour") return timeSeries;
    // Group by day
    const buckets: Record<string, number> = {};
    for (const point of timeSeries) {
      const day = point.time.slice(0, 10);
      buckets[day] = (buckets[day] || 0) + point.count;
    }
    return Object.entries(buckets).map(([time, count]) => ({ time, count }));
  }, [granularity, timeSeries]);

  // Find peak point
  const peak = useMemo(() => {
    if (!data.length) return null;
    return data.reduce(
      (max, point, idx) => (point.count > max.count ? { ...point, idx } : max),
      { ...data[0], idx: 0 }
    );
  }, [data]);

  // Calculate total votes in selected range (brush)
  const totalVotes = useMemo(() => {
    if (!data.length) return 0;
    if (!brushIndex) return data.reduce((sum, d) => sum + d.count, 0);
    const [start, end] = brushIndex;
    return data.slice(start, end + 1).reduce((sum, d) => sum + d.count, 0);
  }, [data, brushIndex]);

  // Handle brush change
  const handleBrushChange = (range: {
    startIndex?: number;
    endIndex?: number;
  }) => {
    if (
      typeof range.startIndex === "number" &&
      typeof range.endIndex === "number"
    ) {
      setBrushIndex([range.startIndex, range.endIndex]);
    } else {
      setBrushIndex(null);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <CardTitle className="text-lg font-semibold">
              Vote Timeline
            </CardTitle>
          </div>
          <div className="max-w-xs w-full">
            <Select
              value={granularity}
              onValueChange={(v) => {
                setGranularity(v as "hour" | "day");
                setBrushIndex(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Granularity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30min">Every 30 min</SelectItem>
                <SelectItem value="hour">Hourly</SelectItem>
                <SelectItem value="day">Daily</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-2">
          Visual representation of vote distribution by chronology
        </p>
      </CardHeader>
      <CardContent>
        <div className="mt-2 text-sm text-gray-600">
          <span className="font-semibold">Total votes in view: </span>
          <span className="font-mono">{totalVotes}</span>
        </div>
        {data.length === 0 ? (
          <div className="h-80 flex items-center justify-center text-gray-500">
            No vote data
          </div>
        ) : (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 14 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={false}
                />
                {peak && data.length > 0 && (
                  <ReferenceDot
                    x={peak.time}
                    y={peak.count}
                    r={8}
                    fill="#f43f5e"
                    stroke="none"
                    label={{
                      value: `Peak (${peak.count})`,
                      position: "top",
                      fontSize: 12,
                      fill: "#f43f5e",
                    }}
                  />
                )}
                {/* Zoom/pan controls */}
                <Brush
                  dataKey="time"
                  height={24}
                  stroke="#8884d8"
                  travellerWidth={12}
                  onChange={handleBrushChange}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
