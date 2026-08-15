"use client";

/* 08 · PERFORMANCE — “Pulang” (Insomniacks).
    Runs on the OFFICIAL Apple-Music word-synced TTML (public/lyrics/pulang.ttml)
    plus the actual track (public/audio/pulang.flac). The audio IS the clock, so
    lyrics are locked word-for-word - no drift, no tap-along guesswork.
    Keys on the stage machine: P play/pause, ↓/↑ jump to next/prev line, R restart. */

import SlideShell from "@/layouts/SlideShell";
import AmLyricsStage from "@/components/AmLyricsStage";
import { useSlideContent } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "pulang",
  title: "08 · Performance — Pulang",
  transition: "baton-change",
  durationHint: 276,
  notes:
    "Lyric slide - press P on the stage keys to start the track; lyrics follow it word-for-word. ↓/↑ jump to the next/prev line, R restarts. If the band performs it live instead, remove the audio prop and tap along with ↓/↑.",
  accent: "vio",
};

export const content = {
  kind: "BAND PERFORMANCE",
  song: "PULANG",
  artist: "INSOMNIACKS",
};

/* section markers lifted straight from the official TTML timestamps */
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

export default function PulangPerformance() {
  const header = useSlideContent(meta.id, content);
  return (
    <SlideShell>
      <AmLyricsStage
        cues={[]}
        header={header}
        bpm={82}
        accent="vio"
        cover="/cover-pulang.jpg"
        ttmlUrl="/lyrics/pulang.ttml"
        audio="/audio/pulang.flac"
        sections={sections}
      />
    </SlideShell>
  );
}
