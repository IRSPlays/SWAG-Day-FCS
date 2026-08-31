"use client";

/* 10 · GAME 01 — INFLATABLE BALL RELAY.
   Massive 2-Alliance Arena Faceoff with 240px live score numerals. */

import { motion } from "motion/react";
import SlideShell, { CourtLines, LiveBug, TickerBand } from "@/layouts/SlideShell";
import { LetterStagger, ClipWipeReveal } from "@/animations";
import { useSlideContent, useShow } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "game-inflatable-relay",
  title: "10 · Game 01 — Inflatable Ball Relay",
  transition: "track-sweep",
  durationHint: 180,
  notes:
    "Game 01 live! 2 Alliances: Sec 1+2 vs Sec 3+4. Controller awards points live (+3 1st, +1 2nd).",
  accent: "mag",
};

export const content = {
  kicker: "EVENT 01 · 2-ALLIANCE RELAY SHOWDOWN",
  title: "INFLATABLE RELAY",
  allianceA: {
    name: "ALLIANCE A",
    cohorts: "SEC 1 + SEC 2",
    teams: "TITANS × CYCLONES",
    color: "#4758d6",
    accent: "#ea3a3a",
  },
  allianceB: {
    name: "ALLIANCE B",
    cohorts: "SEC 3 + SEC 4",
    teams: "VIPERS × APEX",
    color: "#eeeded",
    accent: "#e1811f",
  },
  ticker: [
    "GAME 01 IN PROGRESS",
    "SEC 1 & 2 ALLIANCE",
    "VS",
    "SEC 3 & 4 ALLIANCE",
    "KEEP THE BALL MOVING",
    "LIVE FLOOR ACTION",
    "SWAG DAY '26",
  ],
};

export default function GameInflatableRelay() {
  const c = useSlideContent(meta.id, content);
  const scores = useShow((s) => s.scores);
  const timerEndsAt = useShow((s) => s.timerEndsAt);

  const scoreA = (scores.sec1 ?? 0) + (scores.sec2 ?? 0);
  const scoreB = (scores.sec3 ?? 0) + (scores.sec4 ?? 0);

  return (
    <SlideShell>
      <CourtLines />

      {/* top broadcast header */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between border-b-2 border-ice/10 bg-court/80 px-14 py-4 backdrop-blur-md">
        <div className="flex items-center gap-4 font-mono text-[16px] font-bold tracking-[0.35em] text-ice/80">
          <LiveBug label="GAME 01 LIVE" />
          <span>{c.kicker}</span>
        </div>
        <div className="font-mono text-[16px] font-bold tracking-[0.35em] text-mag">
          1ST PLACE +3 PTS · 2ND PLACE +1 PT
        </div>
      </div>

      {/* massive 2-alliance split arena */}
      <div className="relative z-10 grid h-full grid-cols-2 divide-x-4 divide-ice/10 pt-16 pb-20">
        {/* Left Side: Alliance A (Sec 1 + Sec 2) */}
        <motion.div
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex flex-col justify-between p-14"
        >
          {/* background team tint */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#4758d6]/10 to-transparent" />

          {/* alliance header */}
          <div className="relative z-10">
            <div className="inline-block border-2 border-[#4758d6] bg-[#4758d6]/20 px-4 py-1 font-mono text-[14px] font-bold tracking-[0.35em] text-[#4758d6]">
              {c.allianceA.name}
            </div>
            <h2 className="mt-3 font-display text-[96px] font-black uppercase leading-none tracking-tight text-ice">
              {c.allianceA.cohorts}
            </h2>
            <p className="mt-2 font-mono text-[18px] font-bold tracking-[0.3em] text-[#4758d6]">
              {c.allianceA.teams}
            </p>
          </div>

          {/* massive live score display */}
          <div className="relative z-10 my-auto flex items-baseline gap-6">
            <span className="font-display text-[260px] font-black leading-none text-[#4758d6]">
              {scoreA}
            </span>
            <span className="font-mono text-[24px] font-bold tracking-[0.3em] text-ice/40">
              PTS
            </span>
          </div>

          {/* alliance foot */}
          <div className="relative z-10 border-t-2 border-ice/10 pt-4 font-mono text-[14px] font-bold tracking-[0.25em] text-ice/60">
            SEC 1 TITANS + SEC 2 CYCLONES
          </div>
        </motion.div>

        {/* Right Side: Alliance B (Sec 3 + Sec 4) */}
        <motion.div
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex flex-col justify-between p-14 text-right"
        >
          {/* background team tint */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-[#eeeded]/10 to-transparent" />

          {/* alliance header */}
          <div className="relative z-10">
            <div className="inline-block border-2 border-[#eeeded] bg-[#eeeded]/20 px-4 py-1 font-mono text-[14px] font-bold tracking-[0.35em] text-[#eeeded]">
              {c.allianceB.name}
            </div>
            <h2 className="mt-3 font-display text-[96px] font-black uppercase leading-none tracking-tight text-ice">
              {c.allianceB.cohorts}
            </h2>
            <p className="mt-2 font-mono text-[18px] font-bold tracking-[0.3em] text-[#eeeded]">
              {c.allianceB.teams}
            </p>
          </div>

          {/* massive live score display */}
          <div className="relative z-10 my-auto flex items-baseline justify-end gap-6">
            <span className="font-display text-[260px] font-black leading-none text-[#eeeded]">
              {scoreB}
            </span>
            <span className="font-mono text-[24px] font-bold tracking-[0.3em] text-ice/40">
              PTS
            </span>
          </div>

          {/* alliance foot */}
          <div className="relative z-10 border-t-2 border-ice/10 pt-4 font-mono text-[14px] font-bold tracking-[0.25em] text-ice/60">
            SEC 3 VIPERS + SEC 4 & STAFF APEX
          </div>
        </motion.div>
      </div>

      {/* center massive VS clash stamp */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          initial={{ scale: 0.7, rotate: -15, opacity: 0 }}
          animate={{ scale: 1, rotate: -5, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="border-4 border-court bg-mag px-8 py-4 shadow-2xl"
        >
          <span className="font-display text-[90px] font-black leading-none text-court">
            VS
          </span>
        </motion.div>
      </div>

      {/* bottom ticker */}
      <div className="absolute inset-x-0 bottom-0 z-30">
        <TickerBand items={c.ticker} />
      </div>
    </SlideShell>
  );
}
