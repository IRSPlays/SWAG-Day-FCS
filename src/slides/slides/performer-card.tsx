"use client";

/* Shared performer intro card for acts whose song is not confirmed yet.
    Gig-poster silhouette: a giant ghost act-number behind, massive Anton
    name over a mono kickline, accent bar sweeping in. */

import { motion } from "motion/react";
import SlideShell, { CourtLines, LiveBug } from "@/layouts/SlideShell";
import { LetterStagger, ClipWipeReveal } from "@/animations";
import { useSlideContent } from "@/store/show";
import type { SlideMeta } from "../types";

export interface PerformerCardContent {
  kicker: string;
  actNo: string;
  name: string;
  actType: string;
  detail: string;
  cheer: string;
}

const ACCENTS: Record<string, string> = {
  volt: "#4758d6",
  mag: "#ea3a3a",
  vio: "#e1811f",
};

export function PerformerCard({
  slideMeta,
  content,
}: {
  slideMeta: SlideMeta;
  content: PerformerCardContent;
}) {
  const c = useSlideContent(slideMeta.id, content);
  const hex = ACCENTS[slideMeta.accent ?? "volt"];
  const flip = c.actNo.charCodeAt(0) % 2 === 1; /* stable per act */

  return (
    <SlideShell>
      <CourtLines />

      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between border-b-2 border-ice/10 px-14 py-4">
        <LiveBug label="NEXT ON STAGE" />
        <span className="font-mono text-[16px] font-bold tracking-[0.4em]" style={{ color: hex }}>
          {c.actType}
        </span>
      </div>

      {/* ghost act number */}
      <motion.span
        initial={{ opacity: 0, scale: 1.15 }}
        animate={{ opacity: 0.07, scale: 1 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        aria-hidden
        className={`pointer-events-none absolute top-1/2 z-0 -translate-y-1/2 select-none font-display text-[640px] leading-none ${
          flip ? "right-[-4%]" : "left-[-4%]"
        }`}
        style={{ color: hex }}
      >
        {c.actNo}
      </motion.span>

      <div
        className={`relative z-10 flex h-full flex-col justify-center px-16 pb-16 pt-20 ${
          flip ? "items-start text-left" : "items-end text-right"
        }`}
      >
        <ClipWipeReveal delay={0.1} from="top">
          <span
            className="inline-block border-2 px-5 py-2 font-mono text-[14px] font-bold tracking-[0.45em]"
            style={{ borderColor: `${hex}88`, color: hex }}
          >
            {c.kicker}
          </span>
        </ClipWipeReveal>

        <div
          className={`mt-6 font-display uppercase leading-[0.86] tracking-tight text-ice ${
            flip ? "skew-x-[-4deg]" : "skew-x-[4deg]"
          }`}
          style={{ fontSize: "min(11vw, 176px)" }}
        >
          <LetterStagger
            text={c.name}
            delay={0.35}
            skewX={flip ? -6 : 6}
          />
        </div>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.85, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className={`mt-4 h-[6px] w-[420px] ${flip ? "origin-left" : "origin-right"}`}
          style={{ background: hex }}
        />

        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 flex flex-col gap-1.5"
        >
          <span className="font-mono text-[15px] font-bold tracking-[0.35em] text-ice/70">
            {c.detail}
          </span>
          <span
            className="font-serifit text-[40px] italic"
            style={{ color: hex }}
          >
            {c.cheer}
          </span>
        </motion.div>
      </div>
    </SlideShell>
  );
}
