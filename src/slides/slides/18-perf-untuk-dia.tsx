"use client";

/* 12 · PERFORMANCE — "Untuk Dia" (SleeQ feat. Najwa Latif).
    Word-synced TTML + the INSTRUMENTAL track (the duet sings live over
    it). RIGHT ARROW starts the track; lyrics follow the clock. */

import SlideShell from "@/layouts/SlideShell";
import LyricsMograph from "@/components/LyricsMograph";
import { useSlideContent } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "perf-untuk-dia",
  title: "12 · Airis & Serena — Untuk Dia",
  transition: "baton-change",
  durationHint: 222,
  notes:
    "Duet from Phoenix 4! RIGHT ARROW starts the track; lyrics follow it. Their confidence is unmatched.",
  accent: "vio",
};

export const content = {
  kind: "MALAY POP DUET",
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
        audio="/audio/untuk-dia-instrumental.wav"
        sections={sections}
        credits={performers}
        slideId={meta.id}
      />
    </SlideShell>
  );
}
