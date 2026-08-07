"use client";

/* LetterStagger — kinetic type: each glyph whips up out of its own mask. */

import { motion } from "motion/react";
import { EASE_WHIP } from "@/motion/choreography";

export interface LetterStaggerProps {
  text: string;
  className?: string;
  /** seconds before the first letter fires */
  delay?: number;
  /** seconds between letters */
  stagger?: number;
  duration?: number;
  /** starting vertical offset (em) */
  from?: string;
  /** starting skew in degrees — the "whip" lean */
  skewX?: number;
}

export default function LetterStagger({
  text,
  className,
  delay = 0,
  stagger = 0.034,
  duration = 0.72,
  from = "0.92em",
  skewX = 8,
}: LetterStaggerProps) {
  return (
    <span className={className} aria-label={text}>
      {Array.from(text).map((ch, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block will-change-transform"
            initial={{ y: from, skewX }}
            animate={{ y: "0em", skewX: 0 }}
            transition={{ duration, ease: EASE_WHIP, delay: delay + i * stagger }}
          >
            {ch === " " ? "\u00A0" : ch}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
