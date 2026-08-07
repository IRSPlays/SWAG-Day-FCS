"use client";

/* WhistleCut — hard cut with a flash. Maximum hype, zero warning. */

import { motion } from "motion/react";
import type { SlideDirection, TransitionDef } from "./types";

function WhistleCutOverlay(_props: { dir: SlideDirection }) {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-40 bg-ice"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.85, 0] }}
      transition={{ duration: 0.22, times: [0, 0.3, 1], ease: "easeOut" }}
    />
  );
}

export const whistleCut: TransitionDef = {
  id: "whistle-cut",
  label: "Whistle Cut",
  describe: "Hard cut with a white flash — maximum hype, zero warning.",
  getMotion: () => ({
    initial: { opacity: 0, scale: 1.06 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1 },
    transition: { duration: 0.16, ease: "easeOut" },
  }),
  Overlay: WhistleCutOverlay,
};
