"use client";

/* 17 · FINAL PERFORMANCE — closing band — "Pulang" (Insomniacks).
    LIVE BAND, MANUAL CONTROL: no backing track — the RIGHT ARROW lights
    the lyrics WORD BY WORD. Haziq on piano (backup vocals), Syazwan
    singing. Official word-synced TTML drives the per-word split. */

import SlideShell from "@/layouts/SlideShell";
import LyricsMograph from "@/components/LyricsMograph";
import { useSlideContent } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "perf-final-band",
  title: "17 · Final Performance — Pulang",
  transition: "baton-change",
  durationHint: 276,
  notes:
    "The last item of the day! Pulang — Haziq on piano & backup vocals, Syazwan on vocals. RIGHT ARROW = word by word (no track).",
  accent: "vio",
};

export const content = {
  kind: "FINAL PERFORMANCE · LIVE BAND",
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
  { role: "PIANO · BACKUP VOCALS", names: ["Haziq"] },
  { role: "VOCALS", names: ["Syazwan"] },
];

export default function PerfFinalBand() {
  const header = useSlideContent(meta.id, content);
  return (
    <SlideShell>
      <LyricsMograph
        cues={[]}
        header={header}
        bpm={96}
        accent="vio"
        cover="/covers/pulang.jpg"
        ttmlUrl="/lyrics/pulang.ttml"
        sections={sections}
        credits={performers}
        slideId={meta.id}
      />
    </SlideShell>
  );
}
