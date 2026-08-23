"use client";

/* 14 · PERFORMANCE 08 — Grand Vocal Ensemble. */

import SlideShell from "@/layouts/SlideShell";
import LyricsMograph from "@/components/LyricsMograph";
import { useSlideContent } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "perf-song8",
  title: "14 · Performance 8 — Vocal Ensemble",
  transition: "baton-change",
  durationHint: 240,
  notes: "Grand ensemble performance before the finale! All voices on stage.",
  accent: "mag",
};

export const content = {
  kind: "ALL-STARS VOCAL ENSEMBLE 08",
  song: "STAND BY ME",
  artist: "SWAG DAY ENSEMBLE",
};

export const performers = [
  { role: "ALL-STARS CHOIR", names: ["Student Vocalists", "Staff Choir"] },
  { role: "PIANO & STRINGS", names: ["Accompaniment"] },
];

export default function PerfSong8() {
  const header = useSlideContent(meta.id, content);
  return (
    <SlideShell>
      <LyricsMograph
        cues={[
          { t: 8.0, text: "When the night has come and the land is dark", style: "verse" },
          { t: 16.0, text: "And the moon is the only light we'll see", style: "verse" },
          { t: 24.0, text: "No, I won't be afraid, no, I won't be afraid", style: "verse" },
          { t: 32.0, text: "Just as long as you stand, stand by me", style: "chorus" },
          { t: 40.0, text: "So darling, darling, stand by me", style: "chorus" },
        ]}
        header={header}
        bpm={118}
        accent="mag"
        cover="/covers/pulang.jpg"
        credits={performers}
        slideId={meta.id}
      />
    </SlideShell>
  );
}
