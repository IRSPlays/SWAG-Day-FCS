import type { ComponentType } from "react";
import type { TargetAndTransition, Transition } from "motion/react";

/** 1 = forward through the deck · -1 = backward */
export type SlideDirection = 1 | -1;

export interface SlideMotion {
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  exit: TargetAndTransition;
  transition: Transition;
}

/**
 * A transition is a self-contained file that knows how to move a slide
 * in and out, plus an optional full-screen overlay (sweeps, flashes).
 * Slides only ever reference a transition by its id.
 */
export interface TransitionDef {
  id: string;
  label: string;
  describe: string;
  getMotion: (dir: SlideDirection) => SlideMotion;
  Overlay?: ComponentType<{ dir: SlideDirection }>;
}
