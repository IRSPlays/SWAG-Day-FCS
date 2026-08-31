"use client";

/* 13 · GUESS WHOSE DESK! — the game tournament, scoreboard style.
    Photos of teachers' childhood desks appear on the round slide; this
    intro sets the rules. Fastest hands in the hall win prizes. */

import { motion } from "motion/react";
import SlideShell, { CourtLines, LiveBug, TickerBand } from "@/layouts/SlideShell";
import { LetterStagger, ClipWipeReveal } from "@/animations";
import { useSlideContent } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "game-desk",
  title: "13 · Game — Guess Whose Desk!",
  transition: "split-flap-reset",
  durationHint: 60,
  notes:
    "NJ hypes it up: prizes on the line! Photos of teachers' desks when they were little, four options each. Fastest hands answer; teachers & alumni may play too.",
  accent: "volt",
};

export const content = {
  kicker: "THE SWAG DAY GAME TOURNAMENT",
  titleTop: "GUESS",
  titleBottom: "WHOSE DESK!",
  rules: [
    { no: "01", text: "A childhood desk photo appears" },
    { no: "02", text: "Four teachers. One true desk." },
    { no: "03", text: "Fastest hands in the hall answer" },
  ],
  prize: "PRIZES ON THE LINE · TEACHERS & ALUMNI MAY PLAY",
  ticker: [
    "GUESS WHOSE DESK",
    "FASTEST HANDS WIN",
    "SWAG DAY '26",
  ],
};

export default function GameDeskIntro() {
  const c = useSlideContent(meta.id, content);

  return (
    <SlideShell>
      <CourtLines />

      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between border-b-2 border-ice/10 px-14 py-4">
        <LiveBug label="GAME ON" />
        <span className="font-mono text-[16px] font-bold tracking-[0.4em] text-volt">
          {c.kicker}
        </span>
      </div>

      <div className="relative z-10 grid h-full grid-cols-[1.2fr_1fr] items-center gap-14 px-16 pb-20 pt-24">
        <div>
          <h1 className="font-display uppercase leading-[0.84] tracking-tighter">
            <LetterStagger text={c.titleTop} delay={0.25} className="block text-[136px] text-ice" />
            <div className="block skew-x-[-6deg] text-[104px] text-volt">
              <LetterStagger text={c.titleBottom} delay={0.5} skewX={-6} />
            </div>
          </h1>
          <ClipWipeReveal delay={0.75}>
            <p className="mt-6 border-l-4 border-volt pl-5 font-body text-[24px] font-bold tracking-[0.14em] text-ice/70">
              {c.prize}
            </p>
          </ClipWipeReveal>
        </div>

        {/* rules board — locker-room tactics */}
        <div className="flex flex-col gap-4">
          {c.rules.map((r, i) => (
            <motion.div
              key={r.no}
              initial={{ x: 70, opacity: 0, filter: "blur(8px)" }}
              animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
              transition={{ delay: 0.6 + i * 0.22, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-5 border-2 border-ice/15 bg-panel/80 px-6 py-5"
            >
              <span className="font-display text-[44px] font-black text-volt">{r.no}</span>
              <span className="font-body text-[27px] font-bold text-ice">{r.text}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-30">
        <TickerBand items={c.ticker} />
      </div>
    </SlideShell>
  );
}
