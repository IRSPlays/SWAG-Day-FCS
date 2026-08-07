"use client";

/* KenBurns — slow documentary drift for photos and glow fields. */

import { motion } from "motion/react";

export interface KenBurnsProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  scale?: number;
  delay?: number;
}

export default function KenBurns({
  children,
  className,
  duration = 16,
  scale = 1.12,
  delay = 0,
}: KenBurnsProps) {
  return (
    <div className={`overflow-hidden ${className ?? ""}`}>
      <motion.div
        className="h-full w-full will-change-transform"
        initial={{ scale: 1.02, x: "0%", y: "0%" }}
        animate={{ scale, x: "-1.6%", y: "-1.2%" }}
        transition={{ duration, ease: "linear", delay }}
      >
        {children}
      </motion.div>
    </div>
  );
}
