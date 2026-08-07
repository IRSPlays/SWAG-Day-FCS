"use client";

/* ReactionLayer — audience emoji storms floating up over the stage frame. */

import { motion } from "motion/react";
import { useShow } from "@/store/show";

const LANES = [6, 16, 26, 38, 50, 62, 74, 86];

export default function ReactionLayer() {
  const reactions = useShow((s) => s.reactions);
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {reactions.map((r, i) => {
        const left = LANES[(r.id.charCodeAt(0) + i) % LANES.length];
        const drift = ((r.id.charCodeAt(1) % 21) - 10) * 4;
        const size = 44 + (r.id.charCodeAt(2) % 5) * 14;
        return (
          <motion.span
            key={r.id}
            className="absolute bottom-[-80px] will-change-transform"
            style={{ left: `${left}%`, fontSize: size }}
            initial={{ y: 0, opacity: 0, scale: 0.4, rotate: -8 }}
            animate={{ y: -1250, opacity: [0, 1, 1, 0], scale: 1, rotate: drift }}
            transition={{ duration: 4.4, ease: "easeOut" }}
          >
            {r.emoji}
          </motion.span>
        );
      })}
    </div>
  );
}
