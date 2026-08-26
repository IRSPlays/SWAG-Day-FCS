"use client";

/* 17 · PERFORMANCE 07 — "Still Into You" (Paramore).
    Synced TTML (lrclib) + official track. Pop-punk wall of energy. */

import SlideShell from "@/layouts/SlideShell";
import LyricsMograph from "@/components/LyricsMograph";
import { useSlideContent } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "perf-still-into-you",
  title: "17 · Performance 7 — Still Into You",
  transition: "whistle-cut",
  durationHint: 221,
  notes:
    "Pop-punk energy spike! Press P to start the track; lyrics follow it word-for-word. Get the hall clapping on the beat.",
  accent: "mag",
};

export const content = {
  kind: "SOLO VOCAL PERFORMANCE 07",
  song: "STILL INTO YOU",
  artist: "PARAMORE",
};

/* section markers lifted from the synced TTML timestamps */
export const sections = [
  { t: 0, label: "INTRO" },
  { t: 11.6, label: "VERSE 1" },
  { t: 25.6, label: "PRE-CHORUS" },
  { t: 38, label: "BUILD" },
  { t: 41.1, label: "CHORUS" },
  { t: 74, label: "VERSE 2" },
  { t: 105.3, label: "CHORUS" },
  { t: 140, label: "BRIDGE" },
  { t: 168.9, label: "BREAKDOWN" },
  { t: 179.3, label: "FINAL CHORUS" },
];

export const performers = [
  { role: "VOCALS", names: ["Sofhea"] },
  { role: "CLASS", names: ["Aquila 6"] },
];

export default function PerfStillIntoYou() {
  const header = useSlideContent(meta.id, content);
  return (
    <SlideShell>
      <LyricsMograph
        cues={[]}
        header={header}
        bpm={136}
        accent="mag"
        cover="/covers/still-into-you.jpg"
        ttmlUrl="/lyrics/still-into-you.ttml"
        audio="/audio/still-into-you.flac"
        sections={sections}
        credits={performers}
        slideId={meta.id}
      />
    </SlideShell>
  );
}
