"use client";

/* 20 · CINEMATIC MOVIE END CREDITS & OUTRO BGM.
    Hollywood-style scrolling production credits + bottom-left background
    music player. THE FINAL BEAT: one more RIGHT ARROW slowly fades the
    song out (~3.5s) and sinks the screen to black — the show ends there. */

import { useState } from "react";
import { motion } from "motion/react";
import SlideShell from "@/layouts/SlideShell";
import MovieCredits from "@/components/MovieCredits";
import OutroBgmPlayer from "@/components/OutroBgmPlayer";
import { useSlideAction } from "@/engine/advance";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "end-credits",
  title: "20 · Cinematic Movie End Credits",
  transition: "slow-fade-black",
  durationHint: 180,
  notes:
    "Credits roll with 'September' playing. RIGHT ARROW = slow fade-out: the song ramps down and the screen fades to black. That's the show — nothing comes after.",
  accent: "mag",
};

export default function EndCredits() {
  const [fading, setFading] = useState(false);

  /* the last advance of the night: fade the music, fade to black */
  useSlideAction(() => {
    setFading(true); /* idempotent — every further press keeps it black */
    return true;
  });

  return (
    <SlideShell>
      {/* cinematic credit crawler */}
      <MovieCredits speed={36} />

      {/* bottom-left "NOW PLAYING" outro music badge */}
      <OutroBgmPlayer
        className="absolute bottom-8 left-8 z-30"
        defaultSrc="/audio/september.flac"
        trackTitle="September"
        trackArtist="Earth, Wind & Fire"
        fadeout={fading}
      />

      {/* slow fade to black — the last frame of the show */}
      <motion.div
        initial={false}
        animate={{ opacity: fading ? 1 : 0 }}
        transition={{ duration: 3.5, ease: "easeInOut" }}
        className="pointer-events-none absolute inset-0 z-50 bg-black"
      />
    </SlideShell>
  );
}
