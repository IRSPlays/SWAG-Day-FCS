"use client";

/* 15 · PERFORMANCE — Rayyan Group — "Everlong" (Foo Fighters).
    LIVE BAND, MANUAL CONTROL: no backing track — the RIGHT ARROW lights
    the lyrics WORD BY WORD. Official word-synced TTML; stadium-rock
    treatment lights up with every chorus. */

import SlideShell from "@/layouts/SlideShell";
import LyricsMograph from "@/components/LyricsMograph";
import { useSlideContent } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "perf-rayyan-group",
  title: "15 · Live Band — Rayyan Group · Everlong",
  transition: "whistle-cut",
  durationHint: 250,
  notes:
    "Band item: Yu Shan, Timothy, Shaun, Xavier, Rayyan & Natra covering Everlong. RIGHT ARROW = word by word (no track). Live drums & electric guitar — hype the rock energy!",
  accent: "volt",
};

export const content = {
  kind: "LIVE ROCK PERFORMANCE",
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
  {
    role: "LIVE BAND",
    names: ["Yu Shan", "Timothy", "Shaun", "Xavier", "Rayyan", "Natra"],
  },
];

export default function PerfRayyanGroup() {
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
        sections={sections}
        credits={performers}
        slideId={meta.id}
      />
    </SlideShell>
  );
}
