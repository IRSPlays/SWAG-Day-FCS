"use client";

/* TrackSweep — lane-stripe baton sweep.
   Three skewed bands (ice → volt → mag) fly across the frame
   while outgoing content shears away and incoming content rides in. */

import { motion } from "motion/react";
import { EASE_HARD, EASE_WHIP } from "@/motion/choreography";
import type { SlideDirection, TransitionDef } from "./types";

function TrackSweepOverlay({ dir }: { dir: SlideDirection }) {
  const colors = ["bg-ice", "bg-volt", "bg-mag"];
  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {colors.map((c, i) => (
        <motion.div
          key={c}
          className={`absolute -top-[25%] h-[150%] w-[42%] ${c}`}
          style={{ left: "-42%", skewX: -14 }}
          initial={{ x: dir === 1 ? "0%" : "480%" }}
          animate={{ x: dir === 1 ? "480%" : "0%" }}
          transition={{ duration: 0.68, ease: EASE_HARD, delay: i * 0.055 }}
        />
      ))}
    </div>
  );
}

export const trackSweep: TransitionDef = {
  id: "track-sweep",
  label: "Track Sweep",
  describe: "Lane-stripe sweep — outgoing slide shears away as color bands fly across.",
  getMotion: (dir) => ({
    initial: { x: dir * 90, opacity: 0, skewX: dir * -2 },
    animate: { x: 0, opacity: 1, skewX: 0 },
    exit: { x: dir * -140, opacity: 0, skewX: dir * 2 },
    transition: { duration: 0.55, ease: EASE_WHIP },
  }),
  Overlay: TrackSweepOverlay,
};
