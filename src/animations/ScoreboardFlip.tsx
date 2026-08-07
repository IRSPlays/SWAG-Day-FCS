"use client";

/* ScoreboardFlip — rows flap in like a split-flap departure board. */

import { motion } from "motion/react";
import { EASE_WHIP } from "@/motion/choreography";

export interface FlipItem {
  key: string;
  node: React.ReactNode;
}

export interface ScoreboardFlipProps {
  items: FlipItem[];
  className?: string;
  rowClassName?: string;
  delay?: number;
  stagger?: number;
}

export default function ScoreboardFlip({
  items,
  className,
  rowClassName,
  delay = 0,
  stagger = 0.09,
}: ScoreboardFlipProps) {
  return (
    <div className={className} style={{ perspective: 1000 }}>
      {items.map((item, i) => (
        <motion.div
          key={item.key}
          className={rowClassName}
          style={{ transformOrigin: "50% 0%" }}
          initial={{ rotateX: -96, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: EASE_WHIP, delay: delay + i * stagger }}
        >
          {item.node}
        </motion.div>
      ))}
    </div>
  );
}
