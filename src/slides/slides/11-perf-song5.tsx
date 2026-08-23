"use client";

/* 11 · PERFORMANCE 05 — Acoustic Live Set.
   Manual tap mode or track playback via /lyrics console. */

import SlideShell from "@/layouts/SlideShell";
import LyricsMograph from "@/components/LyricsMograph";
import { useSlideContent } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "perf-song5",
  title: "11 · Performance 5 — Acoustic Live Set",
  transition: "baton-change",
  durationHint: 200,
  notes: "Post-tournament music block begins! Live acoustic performance.",
  accent: "vio",
};

export const content = {
  kind: "LIVE ACOUSTIC SET 05",
  song: "MEMORIES & MELODIES",
  artist: "STUDENT ENSEMBLE",
};

export const performers = [
  { role: "GUITAR & VOCALS", names: ["Acoustic Duo"] },
  { role: "CAJON", names: ["Percussionist"] },
];

export default function PerfSong5() {
  const header = useSlideContent(meta.id, content);
  return (
    <SlideShell>
      <LyricsMograph
        cues={[
          { t: 8.0, text: "Here's to the ones that we got", style: "verse" },
          { t: 14.0, text: "Cheers to the wish you were here, but you're not", style: "verse" },
          { t: 20.0, text: "'Cause the drinks bring back all the memories", style: "chorus" },
          { t: 26.0, text: "Of everything we've been through", style: "chorus" },
        ]}
        header={header}
        bpm={90}
        accent="vio"
        cover="/covers/pulang.jpg"
        credits={performers}
        slideId={meta.id}
      />
    </SlideShell>
  );
}
