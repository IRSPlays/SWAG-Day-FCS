"use client";

/* WordPunch — chorus energy: every word whips in masked, landing on a
    spring pop. Emphasis words get the accent colour + a slight lean. */

import { motion } from "motion/react";
import { SPRING_POP } from "@/motion/choreography";

export interface WordPunchProps {
  text: string;
  emph?: string[];
  /** tailwind class painted on emphasis words, e.g. "text-volt" */
  accent?: string;
  className?: string;
  delay?: number;
  /** seconds between words */
  stagger?: number;
}

const clean = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

export default function WordPunch({
  text,
  emph,
  accent = "text-volt",
  className,
  delay = 0,
  stagger = 0.085,
}: WordPunchProps) {
  const emphSet = new Set((emph ?? []).map(clean));
  const words = text.split(/\s+/);
  return (
    <span className={className} aria-label={text}>
      {words.map((w, i) => {
        const hot = emphSet.has(clean(w));
        return (
          <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.08em] align-bottom">
            <motion.span
              className={`inline-block will-change-transform ${hot ? accent : ""}`}
              initial={{ y: "0.85em", scale: 0.72, opacity: 0, skewX: 7 }}
              animate={{ y: "0em", scale: 1, opacity: 1, skewX: 0 }}
              transition={{ ...SPRING_POP, delay: delay + i * stagger }}
            >
              {w}
              {i < words.length - 1 ? "\u00A0" : ""}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}
