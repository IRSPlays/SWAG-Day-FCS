"use client";

/* 10 · PERFORMANCE — "Flashlight" (Jessie J), Kylie's solo.
    Official INSTRUMENTAL + full official lyrics from the LRC subtitle
    file (Songs/Lyrics). RIGHT ARROW starts the track; the track is the
    clock — lyrics light line-by-line on their own. */

import SlideShell from "@/layouts/SlideShell";
import LyricsMograph from "@/components/LyricsMograph";
import { useSlideContent } from "@/store/show";
import type { LyricCue } from "../lyrics";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "perf-flashlight",
  title: "10 · Kylie — Flashlight",
  transition: "slow-fade-black",
  durationHint: 210,
  notes:
    "Kylie's solo — 'our teachers light up our paths like a flashlight'. RIGHT ARROW starts the instrumental; hall lights dim, phone flashlights up.",
  accent: "volt",
};

export const content = {
  kind: "ACOUSTIC VOCAL SOLO",
  song: "FLASHLIGHT",
  artist: "JESSIE J",
};

/* section map matched to the official LRC timestamps */
export const sections = [
  { t: 0, label: "INTRO" },
  { t: 13.39, label: "VERSE 1" },
  { t: 39.74, label: "CHORUS" },
  { t: 78.08, label: "VERSE 2" },
  { t: 91.65, label: "CHORUS" },
  { t: 116.76, label: "BRIDGE" },
  { t: 130.61, label: "FINAL CHORUS" },
  { t: 157.65, label: "OUTRO" },
];

export const performers = [
  { role: "SOLO VOCALS", names: ["Kylie Natalia"] },
];

/* full lyric track, transcribed from "Flashlight - Jessie J.lrc" */
export const cues: LyricCue[] = [
  { t: 13.39, text: "When tomorrow comes, I'll be on my own", style: "verse" },
  { t: 16.75, text: "Feeling frightened of the things that I don't know", style: "verse" },
  { t: 19.92, text: "When tomorrow comes", style: "verse" },
  { t: 21.76, text: "Tomorrow comes", style: "verse" },
  { t: 23.42, text: "Tomorrow comes", style: "verse" },
  { t: 26.36, text: "And though the road is long, I look up to the sky", style: "verse" },
  { t: 29.44, text: "And in the dark I found lost hope that I won't fly", style: "verse" },
  { t: 32.75, text: "And I sing along", style: "verse" },
  { t: 34.5, text: "I sing along", style: "verse" },
  { t: 36.13, text: "Then I sing along", style: "verse" },
  { t: 39.74, text: "I got all I need when I got you and I", style: "chorus" },
  { t: 42.89, text: "I look around me and see a sweet life", style: "chorus" },
  { t: 46.09, text: "I'm stuck in the dark but you're my flashlight", style: "chorus" },
  { t: 49.34, text: "You're getting me, getting me through the night", style: "chorus" },
  { t: 52.84, text: "Kickstart my heart when you shine it in my eyes", style: "chorus" },
  { t: 56.09, text: "Can't lie, it's a sweet life", style: "chorus" },
  { t: 59.09, text: "I'm stuck in the dark but you're my flashlight", style: "chorus" },
  { t: 62.25, text: "You're getting me, getting me through the night", style: "chorus" },
  { t: 66.81, text: "'Cause you're my flashlight", style: "chorus" },
  { t: 70.16, text: "You're my flashlight, you're my flashlight, oh", style: "chorus" },
  { t: 78.08, text: "I see the shadows long beneath the mountain top", style: "verse" },
  { t: 81.77, text: "I'm not afraid when the rain won't stop", style: "verse" },
  { t: 84.83, text: "'Cause you light the way", style: "verse" },
  { t: 86.67, text: "You light the way", style: "verse" },
  { t: 88.07, text: "You light the way", style: "verse" },
  { t: 91.65, text: "I got all I need when I got you and I", style: "chorus" },
  { t: 94.83, text: "I look around me and see a sweet life", style: "chorus" },
  { t: 98.07, text: "I'm stuck in the dark but you're my flashlight", style: "chorus" },
  { t: 101.29, text: "You're getting me, getting me through the night", style: "chorus" },
  { t: 104.77, text: "Kickstart my heart when you shine it in my eyes", style: "chorus" },
  { t: 107.91, text: "Can't lie, it's a sweet life", style: "chorus" },
  { t: 110.99, text: "I'm stuck in the dark but you're my flashlight", style: "chorus" },
  { t: 114.23, text: "You're getting me, getting me through the night", style: "chorus" },
  { t: 116.76, text: "Light, light, light, you're my flashlight", style: "pre" },
  { t: 120.79, text: "Light, light, you're my flashlight", style: "pre" },
  { t: 123.72, text: "Light, light, light, light, oh", style: "pre" },
  { t: 126.98, text: "You're my flash- oh", style: "pre" },
  { t: 130.61, text: "I got all I need when I got you and I", style: "chorus" },
  { t: 133.64, text: "I look around me and see a sweet life", style: "chorus" },
  { t: 136.94, text: "I'm stuck in the dark but you're my flashlight", style: "chorus" },
  { t: 140.17, text: "You're getting me, getting me through the night", style: "chorus" },
  { t: 143.66, text: "Kickstart my heart when you shine it in my eyes", style: "chorus" },
  { t: 146.83, text: "Can't lie, it's a sweet life", style: "chorus" },
  { t: 149.79, text: "I'm stuck in the dark but, you're my flashlight", style: "chorus" },
  { t: 153.13, text: "You're getting me, getting me through the night", style: "chorus" },
  { t: 157.65, text: "'Cause you're my flashlight", style: "chorus" },
  { t: 160.94, text: "You're my flashlight", style: "chorus" },
  { t: 164.31, text: "You're my flashlight", style: "chorus" },
  { t: 180.7, text: "You're my flashlight, light, light", style: "chorus" },
  { t: 184.11, text: "You're my flashlight, light, light, yeah", style: "chorus" },
  { t: 193.58, text: "You're my flashlight", style: "chorus" },
];

export default function PerfFlashlight() {
  const header = useSlideContent(meta.id, content);
  return (
    <SlideShell>
      <LyricsMograph
        cues={cues}
        header={header}
        bpm={72}
        accent="volt"
        cover="/covers/flashlight.jpg"
        audio="/audio/flashlight-instrumental.wav"
        sections={sections}
        credits={performers}
        slideId={meta.id}
      />
    </SlideShell>
  );
}
