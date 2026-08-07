"use client";

/* SplitFlapReset — the frame folds down like a split-flap board,
   the next slide flaps up into place. Scoreboard energy. */

import { EASE_IN, EASE_WHIP } from "@/motion/choreography";
import type { TransitionDef } from "./types";

export const splitFlapReset: TransitionDef = {
  id: "split-flap-reset",
  label: "Scoreboard Reset",
  describe: "Frame folds down like a split-flap board; next slide flaps up into place.",
  getMotion: () => ({
    initial: { rotateX: 84, opacity: 0 },
    animate: { rotateX: 0, opacity: 1 },
    exit: { rotateX: -84, opacity: 0 },
    transition: {
      duration: 0.5,
      ease: EASE_WHIP,
      exit: { duration: 0.38, ease: EASE_IN },
    },
  }),
};
