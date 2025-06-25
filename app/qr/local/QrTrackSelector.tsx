"use client";
import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import QRCode from "qrcode";

const QRCodeReact = dynamic(() => import("react-qr-code"), { ssr: false });

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
  const [downloading, setDownloading] = useState(false);
  const teams = teamsByTrack[selectedTrack] || [];

  async function handleDownloadPDF() {
    setDownloading(true);
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const boxWidth = pageWidth - margin * 2;
    const boxHeight = pageHeight - margin * 2 - 60; // leave space for header
    const qrSize = Math.min(boxWidth - 40, boxHeight - 100, 350); // max 350px, with padding

    let firstPage = true;
    for (const track of allTracks) {
      const teams = teamsByTrack[track] || [];
      if (!teams.length) continue;
      for (let i = 0; i < teams.length; i++) {
        const { name, url } = teams[i];
        if (!firstPage) doc.addPage();
        firstPage = false;
        // Track header
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text(trackDisplayNames[track], pageWidth / 2, margin, {
          align: "center",
        });
        // Create a temporary DOM node for QR and team name
        const temp = document.createElement("div");
        temp.style.width = `${boxWidth}px`;
        temp.style.height = `${boxHeight}px`;
        temp.style.display = "flex";
        temp.style.flexDirection = "column";
        temp.style.alignItems = "center";
        temp.style.justifyContent = "center";
        temp.style.border = "2px solid #000";
        temp.style.borderRadius = "16px";
        temp.style.background = "#fff";
        temp.style.padding = "24px";
        temp.style.margin = "0 auto";
        temp.style.fontFamily = "Geist, Helvetica, Arial, sans-serif";
        temp.innerHTML = `<div style='font-weight:700;font-size:22px;margin-bottom:24px;text-align:center;'>${name}</div>`;
        // Generate QR code as data URL
        const qrDataUrl = await QRCode.toDataURL(url, {
          width: qrSize,
          margin: 2,
        });
        const img = document.createElement("img");
        img.src = qrDataUrl;
        img.width = qrSize;
        img.height = qrSize;
        img.style.display = "block";
        img.style.margin = "0 auto";
        temp.appendChild(img);
        document.body.appendChild(temp);
        await new Promise((res) => setTimeout(res, 30));
        const imgData = await html2canvas(temp, {
          backgroundColor: "#fff",
          scale: 2,
        }).then((canvas) => canvas.toDataURL("image/png"));
        document.body.removeChild(temp);
        // Center the box on the page
        const x = margin;
        const y = margin + 30; // below header
        doc.addImage(imgData, "PNG", x, y, boxWidth, boxHeight);
      }
    }
    doc.save("qr-codes.pdf");
    setDownloading(false);
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <button
          className="px-5 py-2 rounded bg-black text-white font-semibold shadow hover:bg-gray-800 disabled:opacity-60"
          onClick={handleDownloadPDF}
          disabled={downloading}
        >
          {downloading ? "Generating PDF..." : "Download All as PDF"}
        </button>
        <div className="flex justify-center w-full sm:w-auto">
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
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {teams.map(({ name, url }) => (
          <Card
            key={name}
            className="flex flex-col items-center p-4 shadow border rounded-xl bg-white"
          >
            <div className="bg-white p-2 rounded">
              <QRCodeReact value={url} size={128} />
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
