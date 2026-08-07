"use client";

/* BatonChange — one heavy volt band (trailed by mag) baton-passes the frame. */

import { motion } from "motion/react";
import { EASE_HARD, EASE_WHIP } from "@/motion/choreography";
import type { SlideDirection, TransitionDef } from "./types";

function BatonChangeOverlay({ dir }: { dir: SlideDirection }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      <motion.div
        className="absolute -top-[30%] h-[160%] w-[64%] bg-volt"
        style={{ left: "-64%", skewX: -10 }}
        initial={{ x: dir === 1 ? "0%" : "330%" }}
        animate={{ x: dir === 1 ? "330%" : "0%" }}
        transition={{ duration: 0.7, ease: EASE_HARD }}
      />
      <motion.div
        className="absolute -top-[30%] h-[160%] w-[18%] bg-mag"
        style={{ left: "-20%", skewX: -10 }}
        initial={{ x: dir === 1 ? "0%" : "780%" }}
        animate={{ x: dir === 1 ? "780%" : "0%" }}
        transition={{ duration: 0.7, ease: EASE_HARD, delay: 0.05 }}
      />
    </div>
  );
}

export const batonChange: TransitionDef = {
  id: "baton-change",
  label: "Baton Change",
  describe: "A volt baton band sweeps the frame while content hands over.",
  getMotion: (dir) => ({
    initial: { x: dir * 70, opacity: 0, scale: 0.985 },
    animate: { x: 0, opacity: 1, scale: 1 },
    exit: { x: dir * -70, opacity: 0, scale: 0.985 },
    transition: { duration: 0.5, ease: EASE_WHIP },
  }),
  Overlay: BatonChangeOverlay,
};
