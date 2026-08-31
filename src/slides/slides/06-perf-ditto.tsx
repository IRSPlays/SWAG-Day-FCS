"use client";

/* 06 · PERFORMANCE 02 — “Ditto” (NewJeans).
   Official word-synced TTML + upbeat kinetic pop choreography. */

import SlideShell from "@/layouts/SlideShell";
import LyricsMograph from "@/components/LyricsMograph";
import { useSlideContent } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "perf-ditto",
  title: "09 · Raien — Ditto (Dance)",
  transition: "track-sweep",
  durationHint: 185,
  notes:
    "Raien's dance item! RIGHT ARROW starts the track — the track is the clock, lyrics light up on their own.",
  accent: "mag",
};

export const content = {
  kind: "DANCE PERFORMANCE",
  song: "DITTO",
  artist: "NEWJEANS",
};

export const sections = [
  { t: 0, label: "INTRO" },
  { t: 15.2, label: "VERSE 1" },
  { t: 34.0, label: "PRE-CHORUS" },
  { t: 49.5, label: "CHORUS" },
  { t: 78.2, label: "VERSE 2" },
  { t: 98.4, label: "PRE-CHORUS" },
  { t: 114.0, label: "CHORUS" },
  { t: 142.5, label: "OUTRO" },
];

export const performers = [
  { role: "VOCALS & DANCE", names: ["Raien"] },
];

export default function PerfDitto() {
  const header = useSlideContent(meta.id, content);
  return (
    <SlideShell>
      <LyricsMograph
        cues={[]}
        header={header}
        bpm={134}
        accent="mag"
        cover="/covers/ditto.jpg"
        ttmlUrl="/lyrics/ditto.ttml"
        audio="/audio/ditto.flac"
        sections={sections}
        credits={performers}
        slideId={meta.id}
      />
    </SlideShell>
  );
}
