"use client";

/* 06 · PERFORMANCE 04 — “Flashlight” (Jessie J).
   Soulful acoustic vocal performance with glowing luminous lighting. */

import SlideShell from "@/layouts/SlideShell";
import LyricsMograph from "@/components/LyricsMograph";
import { useSlideContent } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "perf-flashlight",
  title: "06 · Performance 4 — Flashlight",
  transition: "slow-fade-black",
  durationHint: 210,
  notes: "Vocal solo with acoustic backing! Hall lights dim, phone flashlights up.",
  accent: "volt",
};

export const content = {
  kind: "ACOUSTIC VOCAL SOLO 04",
  song: "FLASHLIGHT",
  artist: "JESSIE J",
};

export const sections = [
  { t: 0, label: "INTRO" },
  { t: 14.5, label: "VERSE 1" },
  { t: 42.0, label: "PRE-CHORUS" },
  { t: 55.0, label: "CHORUS" },
  { t: 88.5, label: "VERSE 2" },
  { t: 116.0, label: "PRE-CHORUS" },
  { t: 129.0, label: "CHORUS" },
  { t: 161.5, label: "BRIDGE" },
  { t: 184.0, label: "FINAL CHORUS" },
  { t: 205.0, label: "OUTRO" },
];

export const performers = [
  { role: "SOLO VOCALS", names: ["Vocalist"] },
  { role: "ACOUSTIC GUITAR", names: ["Guitarist"] },
];

export default function PerfFlashlight() {
  const header = useSlideContent(meta.id, content);
  return (
    <SlideShell>
      <LyricsMograph
        cues={[
          { t: 14.5, text: "When tomorrow comes, I'll be on my own", style: "verse" },
          { t: 21.0, text: "Feeling frightened of the things that I don't know", style: "verse" },
          { t: 28.0, text: "When the days are long, when the nights are rough", style: "verse" },
          { t: 35.0, text: "And they said that they've had enough", style: "pre" },
          { t: 55.0, text: "I got all I need when I got you and I", style: "chorus" },
          { t: 62.0, text: "I look around me and see a sweet life", style: "chorus" },
          { t: 69.0, text: "'Cause you're my flashlight, you're my flashlight", style: "chorus" },
          { t: 78.0, text: "You're my flashlight", style: "chorus" },
        ]}
        header={header}
        bpm={72}
        accent="volt"
        cover="/covers/everlong.jpg"
        audio="/audio/flashlight.flac"
        sections={sections}
        credits={performers}
        slideId={meta.id}
      />
    </SlideShell>
  );
}
