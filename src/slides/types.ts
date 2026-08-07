import type { ComponentType } from "react";
import type { TransitionId } from "@/transitions";

/* The contract every slide file fulfils.
   CONTENT lives in the slide file; motion lives elsewhere. */

export interface SlideMeta {
  id: string;
  /** name shown in the controller / deck strip */
  title: string;
  /** which registered transition moves this slide in & out */
  transition: TransitionId;
  /** suggested seconds on screen (autoplay / controller timer) */
  durationHint?: number;
  /** speaker notes for the MC / Tech Lead */
  notes?: string;
  /** accent voice of the slide */
  accent?: "volt" | "mag" | "vio";
}

export interface SlideModule {
  meta: SlideMeta;
  default: ComponentType;
}
