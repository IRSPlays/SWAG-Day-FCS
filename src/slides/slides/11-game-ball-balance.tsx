"use client";

/* 11 · GAME 02 — BALANCE THE BALL.
   4 Massive Stadium Scoreboard Towers with 220px live score numerals. */

import { motion } from "motion/react";
import SlideShell, { CourtLines, LiveBug, TickerBand } from "@/layouts/SlideShell";
import { LetterStagger, ClipWipeReveal } from "@/animations";
import { useSlideContent, useShow } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "game-ball-balance",
  title: "11 · Game 02 — Balance The Ball",
  transition: "track-sweep",
  durationHint: 180,
  notes:
    "Game 02 live! 4 individual teachers navigate the course. Controller awards points live (+3 1st, +2 2nd, +1 3rd).",
  accent: "volt",
};

export const content = {
  kicker: "EVENT 02 · INDIVIDUAL AGILITY OBSTACLE",
  titleTop: "BALANCE",
  titleBottom: "THE BALL",
  serif: "1 teacher per cohort. Steady hands. Zero drops.",
  teams: [
    { id: "sec1", num: "01", cohort: "SEC 1", name: "TITANS", color: "#23dcff" },
    { id: "sec2", num: "02", cohort: "SEC 2", name: "CYCLONES", color: "#ff3da6" },
    { id: "sec3", num: "03", cohort: "SEC 3", name: "VIPERS", color: "#ffd23f" },
    { id: "sec4", num: "04", cohort: "SEC 4", name: "APEX", color: "#8f6bff" },
  ],
  ticker: [
    "GAME 02 IN PROGRESS",
    "DO NOT DROP THE BALL",
    "STEADY HANDS WIN THE ROUND",
    "FASTEST TIME WINS",
    "LIVE FLOOR CAM ACTIVE",
    "SWAG DAY '26",
  ],
};

export default function GameBallBalance() {
  const c = useSlideContent(meta.id, content);
  const scores = useShow((s) => s.scores);

  return (
    <SlideShell className="bg-[#05030c]">
      <CourtLines />

      {/* top broadcast header */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between border-b-2 border-ice/10 bg-court/80 px-14 py-4 backdrop-blur-md">
        <div className="flex items-center gap-4 font-mono text-[16px] font-bold tracking-[0.35em] text-ice/80">
          <LiveBug label="GAME 02 LIVE" />
          <span>{c.kicker}</span>
        </div>
        <div className="font-mono text-[16px] font-bold tracking-[0.35em] text-volt">
          1ST +3 PTS · 2ND +2 PTS · 3RD +1 PT
        </div>
      </div>

      {/* 4 massive stadium scoreboard towers */}
      <div className="absolute inset-x-0 top-[72px] bottom-[56px] z-10 grid grid-cols-4 divide-x-2 divide-ice/10">
        {c.teams.map((t, idx) => {
          const score = scores[t.id as keyof typeof scores] ?? 0;
          return (
            <motion.div
              key={t.id}
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 + idx * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex flex-col justify-between overflow-hidden p-10"
            >
              {/* background watermark number */}
              <span
                className="pointer-events-none absolute -bottom-10 -right-6 select-none font-display text-[280px] font-black leading-none opacity-[0.05]"
                style={{ color: t.color }}
              >
                {t.num}
              </span>

              {/* top team badge */}
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <span
                    className="inline-block border-2 px-3 py-1 font-mono text-[13px] font-bold tracking-[0.3em]"
                    style={{ borderColor: t.color, color: t.color }}
                  >
                    {t.cohort}
                  </span>
                  <span className="font-mono text-[16px] font-bold tracking-widest text-ice/40">
                    #{t.num}
                  </span>
                </div>
                <h3
                  className="mt-3 font-display text-[64px] font-black uppercase leading-none tracking-tight"
                  style={{ color: t.color }}
                >
                  {t.name}
                </h3>
              </div>

              {/* center gigantic live score numeral */}
              <div className="relative z-10 my-auto flex flex-col items-center justify-center">
                <span className="font-mono text-[13px] font-bold tracking-[0.35em] text-ice/40">
                  TOTAL SCORE
                </span>
                <span
                  className="font-display text-[220px] font-black leading-none"
                  style={{ color: t.color }}
                >
                  {score}
                </span>
                <span className="font-mono text-[16px] font-bold tracking-[0.3em] text-ice/50">
                  POINTS
                </span>
              </div>

              {/* bottom team status bar */}
              <div className="relative z-10">
                <div className="h-2 w-full bg-ice/10">
                  <div className="h-full" style={{ background: t.color }} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* bottom ticker */}
      <div className="absolute inset-x-0 bottom-0 z-30">
        <TickerBand items={c.ticker} />
      </div>
    </SlideShell>
  );
}
