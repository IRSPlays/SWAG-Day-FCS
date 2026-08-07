"use client";

/* DeckPlayer — presents one slide inside the broadcast frame and hands
   enter/exit choreography to the transition the slide declared.
   Pure/presentational: the caller (preview page today, /stage with
   realtime cues tomorrow) owns navigation state. */

import { AnimatePresence, motion } from "motion/react";
import ScaledFrame from "./ScaledFrame";
import { getTransition } from "@/transitions";
import type { SlideDirection } from "@/transitions";
import type { SlideModule } from "@/slides/types";

export default function DeckPlayer({
  slide,
  dir,
}: {
  slide: SlideModule;
  dir: SlideDirection;
}) {
  const t = getTransition(slide.meta.transition);
  const m = t.getMotion(dir);
  const Slide = slide.default;
  const Overlay = t.Overlay;

  return (
    <ScaledFrame>
      <div className="absolute inset-0 bg-court" style={{ perspective: 1600 }}>
        <AnimatePresence>
          <motion.div
            key={slide.meta.id}
            className="absolute inset-0 select-none"
            initial={m.initial}
            animate={m.animate}
            exit={m.exit}
            transition={m.transition}
          >
            <Slide />
          </motion.div>
        </AnimatePresence>
        {Overlay ? <Overlay key={`overlay-${slide.meta.id}`} dir={dir} /> : null}
      </div>
    </ScaledFrame>
  );
}
