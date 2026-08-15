"use client";

/* SpotlightSerif — the bridge voice: italic serif letters float in on a
    slow glide, then a light bar sweeps underneath like a follow spot. */

import { motion } from "motion/react";
import { EASE_GLIDE } from "@/motion/choreography";

export interface SpotlightSerifProps {
  text: string;
  className?: string;
  /** class for the light bar gradient, e.g. "from-vio/80" */
  barClass?: string;
  delay?: number;
}

export default function SpotlightSerif({
  text,
  className,
  barClass = "from-vio/90",
  delay = 0,
}: SpotlightSerifProps) {
  const letters = Array.from(text);
  return (
    <span className={`inline-block text-center ${className ?? ""}`} aria-label={text}>
      <span aria-hidden>
        {letters.map((ch, i) => (
          <motion.span
            key={i}
            className="inline-block will-change-transform"
            initial={{ y: "0.5em", opacity: 0 }}
            animate={{ y: "0em", opacity: 1 }}
            transition={{ duration: 1.1, ease: EASE_GLIDE, delay: delay + i * 0.028 }}
          >
            {ch === " " ? "\u00A0" : ch}
          </motion.span>
        ))}
      </span>
      <motion.span
        aria-hidden
        className={`mt-6 block h-[6px] bg-gradient-to-r to-transparent ${barClass}`}
        initial={{ width: "0%", marginLeft: "100%" }}
        animate={{ width: "100%", marginLeft: "0%" }}
        transition={{ duration: 1.4, ease: EASE_GLIDE, delay: delay + letters.length * 0.028 + 0.2 }}
      />
    </span>
  );
}
