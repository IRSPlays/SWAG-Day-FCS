/* Transition registry — every slide-to-slide move in one manifest.
   Slides pick one by id; the future /editor exposes these as safe dropdowns. */

import { trackSweep } from "./TrackSweep";
import { batonChange } from "./BatonChange";
import { whistleCut } from "./WhistleCut";
import { splitFlapReset } from "./SplitFlapReset";
import { slowFadeBlack } from "./SlowFadeBlack";
import type { SlideDirection, TransitionDef } from "./types";

export const transitions = {
  "track-sweep": trackSweep,
  "baton-change": batonChange,
  "whistle-cut": whistleCut,
  "split-flap-reset": splitFlapReset,
  "slow-fade-black": slowFadeBlack,
} as const;

export type TransitionId = keyof typeof transitions;

export const transitionIds = Object.keys(transitions) as TransitionId[];

export const getTransition = (id: TransitionId): TransitionDef => transitions[id];

export type { SlideDirection, TransitionDef } from "./types";
