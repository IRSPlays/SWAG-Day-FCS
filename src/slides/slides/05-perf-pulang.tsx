"use client";

/* 05 · PERFORMANCE 01 — “Pulang” (Insomniacks).
   Official word-synced TTML + actual track.
   Keys: P play/pause, ↓/↑ jump to next/prev line, R restart. */

import SlideShell from "@/layouts/SlideShell";
import LyricsMograph from "@/components/LyricsMograph";
import { useSlideContent } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "perf-pulang",
  title: "05 · Performance 1 — Pulang",
  transition: "baton-change",
  durationHint: 276,
  notes:
    "Press P on the stage keys to start the track or drive from /lyrics console. ↓/↑ jump to next/prev line.",
  accent: "vio",
};

export const content = {
  kind: "BAND PERFORMANCE 01",
  song: "PULANG",
  artist: "INSOMNIACKS",
};

export const sections = [
  { t: 0, label: "INTRO" },
  { t: 18.9, label: "VERSE 1" },
  { t: 45.6, label: "PRE-CHORUS" },
  { t: 54.5, label: "CHORUS" },
  { t: 90.1, label: "VERSE 2" },
  { t: 107.8, label: "CHORUS" },
  { t: 143.3, label: "BRIDGE" },
  { t: 166.7, label: "LIFT" },
  { t: 201.9, label: "FINAL PLEA" },
  { t: 216.4, label: "INSTRUMENTAL" },
  { t: 237.4, label: "FINAL CHORUS" },
];

export const performers = [
  { role: "PIANO", names: ["Haziq"] },
  { role: "VOCALS", names: ["Daniel", "Syazwan", "Anaqi"] },
];

export default function PerfPulang() {
  const header = useSlideContent(meta.id, content);
  return (
    <SlideShell>
      <LyricsMograph
        cues={[]}
        header={header}
        bpm={82}
        accent="vio"
        cover="/covers/pulang.jpg"
        ttmlUrl="/lyrics/pulang.ttml"
        audio="/audio/pulang.flac"
        sections={sections}
        credits={performers}
        slideId={meta.id}
      />
    </SlideShell>
  );
}
