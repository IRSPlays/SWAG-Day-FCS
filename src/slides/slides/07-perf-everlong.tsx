"use client";

/* 07 · PERFORMANCE 03 — “Everlong” (Foo Fighters).
   Rock band stage visual with stadium energy. */

import SlideShell from "@/layouts/SlideShell";
import LyricsMograph from "@/components/LyricsMograph";
import { useSlideContent } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "perf-everlong",
  title: "07 · Performance 3 — Everlong",
  transition: "whistle-cut",
  durationHint: 250,
  notes: "High energy rock band set! Live drums & electric guitar.",
  accent: "volt",
};

export const content = {
  kind: "LIVE ROCK PERFORMANCE 03",
  song: "EVERLONG",
  artist: "FOO FIGHTERS",
};

export const sections = [
  { t: 0, label: "INTRO" },
  { t: 28.5, label: "VERSE 1" },
  { t: 56.2, label: "PRE-CHORUS" },
  { t: 71.0, label: "CHORUS" },
  { t: 104.5, label: "VERSE 2" },
  { t: 132.0, label: "PRE-CHORUS" },
  { t: 147.0, label: "CHORUS" },
  { t: 179.5, label: "BRIDGE / SOLO" },
  { t: 212.0, label: "FINAL CHORUS" },
  { t: 242.0, label: "OUTRO" },
];

export const performers = [
  { role: "GUITAR & VOCALS", names: ["Student Rock Band"] },
  { role: "DRUMS", names: ["Drummer"] },
  { role: "BASS", names: ["Bassist"] },
];

export default function PerfEverlong() {
  const header = useSlideContent(meta.id, content);
  return (
    <SlideShell>
      <LyricsMograph
        cues={[]}
        header={header}
        bpm={158}
        accent="volt"
        cover="/covers/everlong.jpg"
        ttmlUrl="/lyrics/everlong.ttml"
        audio="/audio/everlong.flac"
        sections={sections}
        credits={performers}
        slideId={meta.id}
      />
    </SlideShell>
  );
}
