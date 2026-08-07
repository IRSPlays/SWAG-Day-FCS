"use client";

/* MarqueeTicker — infinite scrolling tape (stadium ticker / news band). */

import { motion } from "motion/react";

export interface MarqueeTickerProps {
  children: React.ReactNode;
  className?: string;
  /** seconds per full loop */
  duration?: number;
}

export default function MarqueeTicker({
  children,
  className,
  duration = 28,
}: MarqueeTickerProps) {
  return (
    <div className={`overflow-hidden whitespace-nowrap ${className ?? ""}`}>
      <motion.div
        className="flex w-max will-change-transform"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration, ease: "linear", repeat: Infinity }}
      >
        <div className="flex shrink-0">{children}</div>
        <div className="flex shrink-0" aria-hidden>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
