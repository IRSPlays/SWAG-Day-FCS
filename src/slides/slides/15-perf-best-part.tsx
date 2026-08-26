"use client";

/* 15 · PERFORMANCE 05 — "Best Part" (Daniel Caesar & H.E.R.).
    Official word-synced TTML + karaoke webm audio. Warm soul duet. */

import SlideShell from "@/layouts/SlideShell";
import LyricsMograph from "@/components/LyricsMograph";
import { useSlideContent } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "perf-best-part",
  title: "15 · Performance 5 — Best Part",
  transition: "baton-change",
  durationHint: 252,
  notes:
    "Talent Block B opener! Duet — press P on stage keys to start the track; lyrics follow word-for-word. ↓/↑ jump lines, R restarts.",
  accent: "vio",
};

export const content = {
  kind: "ACOUSTIC SOUL DUET 05",
  song: "BEST PART",
  artist: "DANIEL CAESAR & H.E.R.",
};

/* section markers lifted from the synced TTML timestamps */
export const sections = [
  { t: 0, label: "INTRO" },
  { t: 6.7, label: "VERSE 1" },
  { t: 38.6, label: "PRE-CHORUS" },
  { t: 51.2, label: "CHORUS" },
  { t: 75.5, label: "HOOK" },
  { t: 91.7, label: "VERSE 2" },
  { t: 116.3, label: "PRE-CHORUS" },
  { t: 129.9, label: "CHORUS" },
  { t: 149.1, label: "HOOK" },
  { t: 167.5, label: "OUTRO" },
];

export const performers = [
  { role: "DUET VOCALS", names: ["Serena", "Airis"] },
  { role: "CLASS", names: ["Phoenix 4"] },
];

export default function PerfBestPart() {
  const header = useSlideContent(meta.id, content);
  return (
    <SlideShell>
      <LyricsMograph
        cues={[]}
        header={header}
        bpm={74}
        accent="vio"
        cover="/covers/best-part.jpg"
        ttmlUrl="/lyrics/best-part.ttml"
        audio="/audio/best-part.webm"
        sections={sections}
        credits={performers}
        slideId={meta.id}
      />
    </SlideShell>
  );
}
