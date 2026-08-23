"use client";

/* 18 · CINEMATIC MOVIE END CREDITS & OUTRO BGM.
   Hollywood-style scrolling production credits + bottom-left background music player. */

import SlideShell from "@/layouts/SlideShell";
import MovieCredits from "@/components/MovieCredits";
import OutroBgmPlayer from "@/components/OutroBgmPlayer";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "end-credits",
  title: "18 · Cinematic Movie End Credits",
  transition: "slow-fade-black",
  durationHint: 180,
  notes:
    "Hollywood-style scrolling end credits. Outro background music plays at 35% volume automatically.",
  accent: "mag",
};

export default function EndCredits() {
  return (
    <SlideShell className="bg-[#05040c]">
      {/* cinematic credit crawler */}
      <MovieCredits speed={36} />

      {/* bottom-left "NOW PLAYING" outro music badge */}
      <OutroBgmPlayer className="absolute bottom-8 left-8 z-30" defaultSrc="/audio/september.flac" />
    </SlideShell>
  );
}
