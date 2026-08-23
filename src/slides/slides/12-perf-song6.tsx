"use client";

/* 12 · PERFORMANCE 06 — Vocal Duet. */

import SlideShell from "@/layouts/SlideShell";
import LyricsMograph from "@/components/LyricsMograph";
import { useSlideContent } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "perf-song6",
  title: "12 · Performance 6 — Vocal Duet",
  transition: "track-sweep",
  durationHint: 195,
  notes: "Vocal duet with backing track. Drive from /lyrics operator page.",
  accent: "mag",
};

export const content = {
  kind: "SPECIAL VOCAL DUET 06",
  song: "COUNT ON ME",
  artist: "VOCAL DUO",
};

export const performers = [
  { role: "LEAD VOCALS", names: ["Duet Lead 1", "Duet Lead 2"] },
  { role: "PIANO", names: ["Accompanist"] },
];

export default function PerfSong6() {
  const header = useSlideContent(meta.id, content);
  return (
    <SlideShell>
      <LyricsMograph
        cues={[
          { t: 6.0, text: "If you ever find yourself stuck in the middle of the sea", style: "verse" },
          { t: 13.0, text: "I'll sail the world to find you", style: "verse" },
          { t: 20.0, text: "You can count on me like one, two, three", style: "chorus" },
          { t: 26.0, text: "I'll be there", style: "chorus" },
          { t: 32.0, text: "'Cause that's what friends are supposed to do", style: "chorus" },
        ]}
        header={header}
        bpm={88}
        accent="mag"
        cover="/covers/ditto.jpg"
        credits={performers}
        slideId={meta.id}
      />
    </SlideShell>
  );
}
