"use client";

/* SoftRise — verse voice: the whole line lifts out of a blur, calm and
    legible. No punch; this is the breathing room between choruses. */

import { motion } from "motion/react";
import { EASE_GLIDE } from "@/motion/choreography";

export interface SoftRiseProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** slower landing for outro lines */
  slow?: boolean;
}

export default function SoftRise({ children, className, delay = 0, slow }: SoftRiseProps) {
  return (
    <motion.div
      className={`will-change-transform ${className ?? ""}`}
      initial={{ y: 34, opacity: 0, filter: "blur(10px)" }}
      animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: slow ? 1.6 : 0.9, ease: EASE_GLIDE, delay }}
    >
      {children}
    </motion.div>
  );
}
