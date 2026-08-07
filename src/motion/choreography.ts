/* ============================================================
   Choreography tokens — the motion language of the show.
   Every transition & animation file pulls its easing from here
   so the whole deck moves with one voice.
   ============================================================ */

import type { Transition } from "motion/react";

export type EasingTuple = [number, number, number, number];

/** violent fast-in, long settle — the default "whip" of the show */
export const EASE_WHIP: EasingTuple = [0.16, 1, 0.3, 1];

/** smooth editorial glide — wipes, reveals, fades */
export const EASE_GLIDE: EasingTuple = [0.65, 0, 0.35, 1];

/** overshoot pop — numerals, badges */
export const EASE_POP: EasingTuple = [0.34, 1.56, 0.64, 1];

/** hard symmetric in-out — sweep overlays */
export const EASE_HARD: EasingTuple = [0.83, 0, 0.17, 1];

/** accelerating exit */
export const EASE_IN: EasingTuple = [0.55, 0, 1, 0.45];

/** spring that lands with a small settle */
export const SPRING_SETTLE: Transition = {
  type: "spring",
  stiffness: 240,
  damping: 22,
  mass: 0.9,
};

/** snappy spring for pops */
export const SPRING_POP: Transition = {
  type: "spring",
  stiffness: 430,
  damping: 26,
};

/** delay(i) = base + i * step — stagger timelines */
export const at =
  (base: number, step: number) =>
  (i: number): number =>
    base + i * step;
