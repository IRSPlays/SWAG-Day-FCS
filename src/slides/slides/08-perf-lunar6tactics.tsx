"use client";

/* 08 · PERFORMANCE — Lunar6tactics (Eryna's band) — "Still Into You" (Paramore).
    LIVE BAND, MANUAL CONTROL: no backing track — the RIGHT ARROW lights
    the lyrics WORD BY WORD. Official word-synced TTML drives the
    per-word split; section lighting follows the song map. */

import SlideShell from "@/layouts/SlideShell";
import LyricsMograph from "@/components/LyricsMograph";
import { useSlideContent } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "perf-lunar6tactics",
  title: "08 · Live Band — Lunar6tactics · Still Into You",
  transition: "whistle-cut",
  durationHint: 221,
  notes:
    "First performance: live band Lunar6tactics covering Still Into You. RIGHT ARROW = word by word (no track — the band is the clock). Pop-punk energy.",
  accent: "mag",
};

export const content = {
  kind: "LIVE BAND PERFORMANCE",
  song: "STILL INTO YOU",
  artist: "PARAMORE",
};

/* section markers lifted from the synced TTML timestamps */
export const sections = [
  { t: 0, label: "INTRO" },
  { t: 11.6, label: "VERSE 1" },
  { t: 25.6, label: "PRE-CHORUS" },
  { t: 38, label: "BUILD" },
  { t: 41.1, label: "CHORUS" },
  { t: 74, label: "VERSE 2" },
  { t: 105.3, label: "CHORUS" },
  { t: 140, label: "BRIDGE" },
  { t: 168.9, label: "BREAKDOWN" },
  { t: 179.3, label: "FINAL CHORUS" },
];

export const performers = [{ role: "LIVE BAND", names: ["Lunar6tactics"] }];

export default function PerfLunar6tactics() {
  const header = useSlideContent(meta.id, content);
  return (
    <SlideShell>
      <LyricsMograph
        cues={[]}
        header={header}
        bpm={136}
        accent="mag"
        cover="/covers/still-into-you.jpg"
        ttmlUrl="/lyrics/still-into-you.ttml"
        sections={sections}
        credits={performers}
        slideId={meta.id}
      />
    </SlideShell>
  );
}
