"use client";

/* SlowFadeBlack — a breath. Slow cross-dissolve through black
   for the sincere beats of the show. */

import { EASE_GLIDE } from "@/motion/choreography";
import type { TransitionDef } from "./types";

export const slowFadeBlack: TransitionDef = {
  id: "slow-fade-black",
  label: "Slow Fade to Black",
  describe: "Slow dissolve through black — for the sincere beats.",
  getMotion: () => ({
    initial: { opacity: 0, scale: 1.03 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.985 },
    transition: { duration: 1.05, ease: EASE_GLIDE },
  }),
};
