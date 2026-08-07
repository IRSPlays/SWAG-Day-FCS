"use client";

/* RiseIn — elements that spring up from below (podium blocks, bars). */

import { motion } from "motion/react";

export interface RiseInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** starting offset — percent of own height */
  from?: string;
}

export default function RiseIn({
  children,
  className,
  delay = 0,
  from = "110%",
}: RiseInProps) {
  return (
    <motion.div
      className={className}
      initial={{ y: from, opacity: 0.5 }}
      animate={{ y: "0%", opacity: 1 }}
      transition={{ type: "spring", stiffness: 210, damping: 24, delay }}
    >
      {children}
    </motion.div>
  );
}
