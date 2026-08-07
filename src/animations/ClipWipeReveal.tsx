"use client";

/* ClipWipeReveal — content unmasks with an animated clip-path wipe. */

import { motion } from "motion/react";
import { EASE_GLIDE } from "@/motion/choreography";

const HIDDEN: Record<string, string> = {
  left: "inset(0 100% 0 0)",
  right: "inset(0 0 0 100%)",
  top: "inset(0 0 100% 0)",
  bottom: "inset(100% 0 0 0)",
};

export interface ClipWipeRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  from?: "left" | "right" | "top" | "bottom";
}

export default function ClipWipeReveal({
  children,
  className,
  delay = 0,
  duration = 0.8,
  from = "left",
}: ClipWipeRevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ clipPath: HIDDEN[from] }}
      animate={{ clipPath: "inset(0 0 0 0)" }}
      transition={{ duration, ease: EASE_GLIDE, delay }}
    >
      {children}
    </motion.div>
  );
}
