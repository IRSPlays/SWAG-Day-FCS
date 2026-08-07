"use client";

/* JerseyPop — oversized numerals/badges that scale-land with overshoot. */

import { motion } from "motion/react";

export interface JerseyPopProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** starting scale */
  from?: number;
  /** starting rotation (deg) that straightens on landing */
  rotate?: number;
}

export default function JerseyPop({
  children,
  className,
  delay = 0,
  from = 0.4,
  rotate = -6,
}: JerseyPopProps) {
  return (
    <motion.div
      className={className}
      initial={{ scale: from, opacity: 0, rotate }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 19, delay }}
    >
      {children}
    </motion.div>
  );
}
