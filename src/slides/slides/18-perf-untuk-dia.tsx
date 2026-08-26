"use client";

/* 18 · PERFORMANCE 08 — "Untuk Dia" (SleeQ feat. Najwa Latif).
    Synced TTML (lrclib) + official track. Malay pop duet closer. */

import SlideShell from "@/layouts/SlideShell";
import LyricsMograph from "@/components/LyricsMograph";
import { useSlideContent } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "perf-untuk-dia",
  title: "18 · Performance 8 — Untuk Dia",
  transition: "baton-change",
  durationHint: 222,
  notes:
    "Block B finale! Press P to start the track; lyrics follow it. Duet performance by Serena & Airis.",
  accent: "vio",
};

export const content = {
  kind: "MALAY POP DUET · BLOCK B FINALE",
  song: "UNTUK DIA",
  artist: "SLEEQ FEAT. NAJWA LATIF",
};

/* section markers lifted from the synced TTML timestamps */
export const sections = [
  { t: 0, label: "INTRO" },
  { t: 2.8, label: "HOOK" },
  { t: 12.9, label: "CHORUS" },
  { t: 41.6, label: "VERSE 1" },
  { t: 82.1, label: "CHORUS" },
  { t: 111, label: "VERSE 2" },
  { t: 155.5, label: "PRE-CHORUS" },
  { t: 158.8, label: "CHORUS" },
  { t: 187.5, label: "OUTRO" },
];

export const performers = [
  { role: "DUET VOCALS", names: ["Serena", "Airis"] },
  { role: "CLASS", names: ["Phoenix 4"] },
];

export default function PerfUntukDia() {
  const header = useSlideContent(meta.id, content);
  return (
    <SlideShell>
      <LyricsMograph
        cues={[]}
        header={header}
        bpm={98}
        accent="vio"
        cover="/covers/untuk-dia.jpg"
        ttmlUrl="/lyrics/untuk-dia.ttml"
        audio="/audio/untuk-dia.flac"
        sections={sections}
        credits={performers}
        slideId={meta.id}
      />
    </SlideShell>
  );
}
