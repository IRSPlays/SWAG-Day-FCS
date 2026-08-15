"use client";

/* 08 · PERFORMANCE — “Pulang” (Insomniacks) · TESTBED for the lyric engine.
    IMPORTANT: the lines below are ORIGINAL placeholder lyrics with real
    timing for a ~80s arrangement — swap in the official lyrics line-by-line
    for the live show (keep each cue’s `t` aligned to the band). Emphasis
    words go in `emph`; sections drive the mograph treatment automatically. */

import SlideShell from "@/layouts/SlideShell";
import LyricTimeline from "@/components/LyricTimeline";
import { useSlideContent } from "@/store/show";
import type { LyricCue } from "../lyrics";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "pulang",
  title: "08 · Performance — Pulang",
  transition: "baton-change",
  durationHint: 84,
  notes:
    "Lyric slide — auto-plays on entry. Tap-along on the stage keys: ↓ next line, ↑ prev line, R re-sync to clock. Drop the music bed and let the band carry.",
  accent: "vio",
};

export const content = {
  kind: "BAND PERFORMANCE",
  song: "PULANG",
  artist: "INSOMNIACKS",
};

export const cues: LyricCue[] = [
  { t: 0.6, style: "hook", label: "OPENING", text: "PULANG" },
  { t: 5.2, style: "verse", label: "VERSE 1", text: "Langit petang menunggu di simpang" },
  { t: 9.4, style: "verse", text: "Langkah kita pulang pada cahaya" },
  { t: 13.6, style: "verse", text: "Jalan yang jauh terasa semakin dekat" },
  { t: 17.8, style: "verse", text: "Satu nama kupanjatkan dalam doa" },
  { t: 22.2, style: "pre", label: "PRE-CHORUS", text: "Walau badai halangi" },
  { t: 25.6, style: "pre", text: "Hati ini tetap pulang", emph: ["pulang"] },
  { t: 29.6, style: "chorus", label: "CHORUS", text: "Pulang kepadamu", emph: ["Pulang"] },
  { t: 33.4, style: "chorus", text: "Tempat kisah kita bermula" },
  { t: 37.2, style: "chorus", text: "Pulang kepadamu", emph: ["Pulang"] },
  { t: 41.0, style: "chorus", text: "Rumah hati yang sentiasa menunggu", emph: ["menunggu"] },
  { t: 45.8, style: "verse", label: "VERSE 2", text: "Setiap luka mengajar kita berdiri" },
  { t: 49.8, style: "verse", text: "Setiap jalan membawa pulang" },
  { t: 53.8, style: "pre", label: "PRE-CHORUS", text: "Walau jauh mata memandang" },
  { t: 57.6, style: "chorus", label: "CHORUS", text: "Selagi ada jalan pulang", emph: ["pulang"] },
  { t: 61.2, style: "chorus", text: "Selagi ada nama menunggu", emph: ["menunggu"] },
  { t: 64.8, style: "chorus", text: "Akan pulang — akan pulang", emph: ["pulang"] },
  { t: 69.2, style: "bridge", label: "BRIDGE", text: "Dan bila malam mula menyepi…" },
  { t: 73.0, style: "bridge", text: "ingatlah — ada cahaya di rumah" },
  { t: 77.5, style: "outro", label: "OUTRO", text: "pulang." },
];

export default function PulangPerformance() {
  const header = useSlideContent(meta.id, content);
  return (
    <SlideShell>
      <LyricTimeline cues={cues} header={header} bpm={82} accent="vio" />
    </SlideShell>
  );
}