"use client";

/* 16 · PERFORMANCE 06 — "The Nights" (Avicii).
    Synced TTML (lrclib) + official track. Big-room festival energy. */

import SlideShell from "@/layouts/SlideShell";
import LyricsMograph from "@/components/LyricsMograph";
import { useSlideContent } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "perf-the-nights",
  title: "16 · Performance 6 — The Nights",
  transition: "track-sweep",
  durationHint: 176,
  notes:
    "Festival anthem! Press P to start the track; lyrics follow it. Caelyn's solo — hype the crowd for the drop.",
  accent: "volt",
};

export const content = {
  kind: "SOLO VOCAL PERFORMANCE 06",
  song: "THE NIGHTS",
  artist: "AVICII",
};

/* section markers lifted from the synced TTML timestamps */
export const sections = [
  { t: 0, label: "INTRO" },
  { t: 3, label: "VERSE 1" },
  { t: 17.5, label: "PRE-CHORUS" },
  { t: 32.6, label: "BUILD" },
  { t: 40.3, label: "CHORUS / DROP" },
  { t: 50.4, label: "INSTRUMENTAL" },
  { t: 78.8, label: "VERSE 2" },
  { t: 93.6, label: "PRE-CHORUS" },
  { t: 109, label: "BUILD" },
  { t: 116.5, label: "FINAL DROP" },
  { t: 126.9, label: "OUTRO" },
];

export const performers = [
  { role: "VOCALS", names: ["Caelyn"] },
  { role: "CLASS", names: ["Aquila 4"] },
];

export default function PerfTheNights() {
  const header = useSlideContent(meta.id, content);
  return (
    <SlideShell>
      <LyricsMograph
        cues={[]}
        header={header}
        bpm={126}
        accent="volt"
        cover="/covers/the-nights.jpg"
        ttmlUrl="/lyrics/the-nights.ttml"
        audio="/audio/the-nights.flac"
        sections={sections}
        credits={performers}
        slideId={meta.id}
      />
    </SlideShell>
  );
}
