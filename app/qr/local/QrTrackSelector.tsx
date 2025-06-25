"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

const QRCode = dynamic(() => import("react-qr-code"), { ssr: false });

interface QrTrackSelectorProps {
  allTracks: string[];
  trackDisplayNames: Record<string, string>;
  teamsByTrack: Record<string, { name: string; url: string }[]>;
}

export default function QrTrackSelector({
  allTracks,
  trackDisplayNames,
  teamsByTrack,
}: QrTrackSelectorProps) {
  const [selectedTrack, setSelectedTrack] = useState(allTracks[0]);
  const teams = teamsByTrack[selectedTrack] || [];

  return (
    <>
      <div className="flex justify-center mb-8">
        <Select value={selectedTrack} onValueChange={setSelectedTrack}>
          <SelectTrigger className="w-72">
            <SelectValue>{trackDisplayNames[selectedTrack]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {allTracks.map((track) => (
              <SelectItem key={track} value={track}>
                {trackDisplayNames[track]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {teams.map(({ name, url }) => (
          <Card
            key={name}
            className="flex flex-col items-center p-4 shadow border rounded-xl bg-white"
          >
            <div className="bg-white p-2 rounded">
              <QRCode value={url} size={128} />
            </div>
            <div className="mt-3 text-center">
              <div className="font-semibold text-base font-sans">{name}</div>
              <div className="text-xs break-all text-gray-500 mt-1">{url}</div>
            </div>
          </Card>
        ))}
        {teams.length === 0 && (
          <div className="col-span-full text-center text-gray-400">
            No teams in this track.
          </div>
        )}
      </div>
    </>
  );
}
