"use client";

/* 13 · TOURNAMENT PODIUM — Champions Crowned.
   Grand Stadium 3D Tiered Podium with live score calculations & gold champion spotlight. */

import { motion } from "motion/react";
import SlideShell, { CourtLines, LiveBug, TickerBand } from "@/layouts/SlideShell";
import { LetterStagger, ClipWipeReveal } from "@/animations";
import { useSlideContent, useShow } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "tournament-podium",
  title: "13 · Tournament Podium — Champions Crowned",
  transition: "split-flap-reset",
  durationHint: 25,
  notes:
    "CROWNING MOMENT! Announce the champion cohort based on live points. Fire stadium cheer!",
  accent: "volt",
};

export const content = {
  kicker: "COHORT CLASH · FINAL STANDINGS",
  titleTop: "CHAMPIONS",
  titleBottom: "CROWNED",
  serif: "Glory to the champions. Respect to all 4 cohorts.",
  cohorts: [
    { id: "sec1", num: "01", name: "TITANS", cohort: "SEC 1", color: "#23dcff" },
    { id: "sec2", num: "02", name: "CYCLONES", cohort: "SEC 2", color: "#ff3da6" },
    { id: "sec3", num: "03", name: "VIPERS", cohort: "SEC 3", color: "#ffd23f" },
    { id: "sec4", num: "04", name: "APEX", cohort: "SEC 4 & STAFF", color: "#8f6bff" },
  ] as const,
  ticker: [
    "CHAMPIONS CROWNED",
    "TEACHERS' DAY '26 TOURNAMENT",
    "CONGRATULATIONS TO ALL COHORTS",
    "SWAG DAY '26",
  ],
};

export default function TournamentPodium() {
  const c = useSlideContent(meta.id, content);
  const scores = useShow((s) => s.scores);

  /* calculate ranked standings */
  const ranked = [...c.cohorts].sort(
    (a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0)
  );

  const first = ranked[0];
  const second = ranked[1];
  const third = ranked[2];

  return (
    <SlideShell className="bg-[#05030c]">
      <CourtLines />

      {/* top broadcast header */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between border-b-2 border-ice/10 bg-court/80 px-14 py-4 backdrop-blur-md">
        <div className="flex items-center gap-4 font-mono text-[16px] font-bold tracking-[0.35em] text-ice/80">
          <LiveBug label="FINAL STANDINGS" />
          <span>{c.kicker}</span>
        </div>
        <div className="font-mono text-[16px] font-bold tracking-[0.35em] text-volt">
          COHORT CLASH '26
        </div>
      </div>

      {/* main podium arena */}
      <div className="relative z-10 flex h-full items-end justify-between px-16 pb-24 pt-20">
        {/* left column: big champion headline */}
        <div className="mb-auto max-w-[620px]">
          <ClipWipeReveal delay={0.1}>
            <div className="inline-block border-2 border-volt bg-volt/15 px-5 py-1.5 font-mono text-[14px] font-bold tracking-[0.4em] text-volt">
              TOURNAMENT WINNER
            </div>
          </ClipWipeReveal>

          <h1 className="mt-4 font-display uppercase leading-[0.82] tracking-tighter text-ice">
            <span className="block text-[140px]">
              <LetterStagger text={c.titleTop} delay={0.2} />
            </span>
            <span className="block -skew-x-6 text-[160px] text-volt">
              <LetterStagger text={c.titleBottom} delay={0.45} />
            </span>
          </h1>

          {first && (
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 border-4 p-6 shadow-2xl backdrop-blur-xl"
              style={{ borderColor: first.color, background: `${first.color}15` }}
            >
              <span className="font-mono text-[13px] font-bold tracking-[0.3em] text-ice/60">
                1ST PLACE OVERALL CHAMPION
              </span>
              <h2
                className="mt-1 font-display text-[72px] font-black uppercase leading-none"
                style={{ color: first.color }}
              >
                {first.name} ({first.cohort})
              </h2>
              <p className="mt-2 font-mono text-[20px] font-bold text-ice">
                TOTAL: {scores[first.id] ?? 0} POINTS
              </p>
            </motion.div>
          )}
        </div>

        {/* right column: 3D tiered stadium podium blocks */}
        <div className="flex items-end gap-6">
          {/* 2nd Place Block */}
          {second && (
            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
              className="flex w-[240px] flex-col items-center"
            >
              <span className="font-display text-[48px] font-bold" style={{ color: second.color }}>
                {second.name}
              </span>
              <span className="font-mono text-[18px] font-bold text-ice/70">
                {scores[second.id] ?? 0} PTS
              </span>
              <div
                className="mt-4 flex h-[300px] w-full flex-col items-center justify-between border-4 bg-panel/90 p-6 shadow-2xl backdrop-blur-md"
                style={{ borderColor: second.color }}
              >
                <span className="font-display text-[110px] font-black leading-none text-ice/30">
                  2
                </span>
                <span className="font-mono text-[14px] font-bold tracking-[0.25em]" style={{ color: second.color }}>
                  {second.cohort}
                </span>
              </div>
            </motion.div>
          )}

          {/* 1st Place (Champion) Block - Center & Tallest */}
          {first && (
            <motion.div
              initial={{ y: 260, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
              className="flex w-[280px] flex-col items-center"
            >
              <span className="font-mono text-[14px] font-black tracking-[0.3em] text-[#ffd23f]">
                ★ WINNER ★
              </span>
              <span className="font-display text-[64px] font-black" style={{ color: first.color }}>
                {first.name}
              </span>
              <span className="font-mono text-[24px] font-black text-ice">
                {scores[first.id] ?? 0} PTS
              </span>
              <div
                className="mt-4 flex h-[420px] w-full flex-col items-center justify-between border-4 bg-panel/95 p-8 shadow-2xl backdrop-blur-xl"
                style={{ borderColor: first.color }}
              >
                <span className="font-display text-[150px] font-black leading-none" style={{ color: first.color }}>
                  1
                </span>
                <span className="font-mono text-[16px] font-black tracking-[0.3em] text-ice">
                  {first.cohort}
                </span>
              </div>
            </motion.div>
          )}

          {/* 3rd Place Block */}
          {third && (
            <motion.div
              initial={{ y: 160, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
              className="flex w-[220px] flex-col items-center"
            >
              <span className="font-display text-[44px] font-bold" style={{ color: third.color }}>
                {third.name}
              </span>
              <span className="font-mono text-[18px] font-bold text-ice/70">
                {scores[third.id] ?? 0} PTS
              </span>
              <div
                className="mt-4 flex h-[220px] w-full flex-col items-center justify-between border-4 bg-panel/90 p-6 shadow-2xl backdrop-blur-md"
                style={{ borderColor: third.color }}
              >
                <span className="font-display text-[90px] font-black leading-none text-ice/30">
                  3
                </span>
                <span className="font-mono text-[14px] font-bold tracking-[0.25em]" style={{ color: third.color }}>
                  {third.cohort}
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* bottom ticker */}
      <div className="absolute inset-x-0 bottom-0 z-30">
        <TickerBand items={c.ticker} />
      </div>
    </SlideShell>
  );
}
