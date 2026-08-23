"use client";

/* 13 · PERFORMANCE 07 — Student Band Set. */

import SlideShell from "@/layouts/SlideShell";
import LyricsMograph from "@/components/LyricsMograph";
import { useSlideContent } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "perf-song7",
  title: "13 · Performance 7 — Student Band Set",
  transition: "whistle-cut",
  durationHint: 220,
  notes: "Upbeat pop-rock band performance! Audience clap-along.",
  accent: "volt",
};

export const content = {
  kind: "LIVE POP ROCK BAND 07",
  song: "BEST DAY OF MY LIFE",
  artist: "STUDENT BAND",
};

export const performers = [
  { role: "LEAD GUITAR & VOCALS", names: ["Band Lead"] },
  { role: "RHYTHM GUITAR", names: ["Guitarist"] },
  { role: "BASS & DRUMS", names: ["Rhythm Section"] },
];

export default function PerfSong7() {
  const header = useSlideContent(meta.id, content);
  return (
    <SlideShell>
      <LyricsMograph
        cues={[
          { t: 8.0, text: "I had a dream so big and loud", style: "verse" },
          { t: 14.0, text: "I jumped so high I touched the clouds", style: "verse" },
          { t: 22.0, text: "This is gonna be the best day of my life", style: "chorus" },
          { t: 28.0, text: "My life, oh oh oh oh", style: "chorus" },
        ]}
        header={header}
        bpm={100}
        accent="volt"
        cover="/covers/everlong.jpg"
        credits={performers}
        slideId={meta.id}
      />
    </SlideShell>
  );
}
