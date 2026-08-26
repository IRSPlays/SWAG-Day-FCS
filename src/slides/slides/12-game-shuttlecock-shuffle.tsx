"use client";

/* 12 · GAME 03 — THE SHUTTLECOCK SHUFFLE.
    Stage race, right to left. Wide-angle framing + live scoreboard towers. */

import { motion } from "motion/react";
import SlideShell, { CourtLines, LiveBug, TickerBand } from "@/layouts/SlideShell";
import { LetterStagger, ClipWipeReveal } from "@/animations";
import { useSlideContent, useShow } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "game-shuttlecock-shuffle",
  title: "12 · Game 03 — Shuttlecock Shuffle",
  transition: "track-sweep",
  durationHint: 180,
  notes:
    "Game 03! Balance the shuttlecock while racing right side of the stage to the left. Drop it = restart. Wide camera shot for the full race.",
  accent: "vio",
};

export const content = {
  kicker: "EVENT 03 · STAGE RACE · RIGHT TO LEFT",
  titleTop: "SHUTTLECOCK",
  titleBottom: "SHUFFLE",
  serif: "Balance it. Move fast. Don't drop it.",
  ruleSlabs: [
    { n: "01", text: "SHUTTLECOCK ON THE RACKET — NO HANDS" },
    { n: "02", text: "RACE FROM STAGE RIGHT TO STAGE LEFT" },
    { n: "03", text: "DROP IT AND BACK TO THE START" },
  ],
  ticker: [
    "GAME 03 IN PROGRESS",
    "EYE ON THE SHUTTLECOCK",
    "DO NOT DROP IT",
    "WIDE CAM LIVE",
    "SWAG DAY '26",
  ],
};

const TEAM_COLORS = ["#23dcff", "#ff3da6", "#ffd23f", "#8f6bff"];

export default function GameShuttlecockShuffle() {
  const c = useSlideContent(meta.id, content);
  const scores = useShow((s) => s.scores);

  return (
    <SlideShell className="bg-[#05030c]">
      <CourtLines />

      {/* top broadcast header */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between border-b-2 border-ice/10 bg-court/80 px-14 py-4 backdrop-blur-md">
        <div className="flex items-center gap-4 font-mono text-[16px] font-bold tracking-[0.35em] text-ice/80">
          <LiveBug label="GAME 03 LIVE" />
          <span>{c.kicker}</span>
        </div>
        <div className="font-mono text-[16px] font-bold tracking-[0.35em] text-vio">
          WIDE CAM · FULL STAGE
        </div>
      </div>

      {/* left: giant title + rules */}
      <div className="absolute left-16 top-[17%] z-10 max-w-[900px]">
        <ClipWipeReveal delay={0.1}>
          <div className="inline-block -rotate-1 border-2 border-vio bg-vio/20 px-5 py-2 font-mono text-[14px] font-bold tracking-[0.4em] text-vio backdrop-blur-md">
            EVENT 03
          </div>
        </ClipWipeReveal>

        <h1 className="mt-4 font-display uppercase leading-[0.82] tracking-tighter text-ice">
          <span className="block text-[110px]">
            <LetterStagger text={c.titleTop} delay={0.2} />
          </span>
          <span className="block -skew-x-6 text-[130px] text-vio">
            <LetterStagger text={c.titleBottom} delay={0.4} />
          </span>
        </h1>

        <ClipWipeReveal delay={0.6} from="left">
          <p className="mt-3 font-serifit text-[38px] italic text-ice/85">{c.serif}</p>
        </ClipWipeReveal>

        <div className="mt-7 flex flex-col gap-3">
          {c.ruleSlabs.map((r, i) => (
            <ClipWipeReveal key={r.n} delay={0.75 + i * 0.12} from="left">
              <div className="flex items-center gap-5 border-l-8 border-vio bg-panel/90 px-7 py-3 backdrop-blur-md">
                <span className="font-display text-[30px] font-black text-vio">{r.n}</span>
                <span className="font-display text-[25px] font-bold uppercase tracking-wider text-ice">
                  {r.text}
                </span>
              </div>
            </ClipWipeReveal>
          ))}
        </div>
      </div>

      {/* right: live score tower (scores carry across all games) */}
      <div className="absolute right-14 top-[18%] z-10 w-[420px]">
        <motion.div
          initial={{ x: 70, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="border-4 border-ice/20 bg-panel/95 p-7 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex items-center justify-between border-b-2 border-dashed border-ice/20 pb-3">
            <span className="font-mono text-[13px] font-bold tracking-[0.3em] text-vio">
              TOURNAMENT TALLY
            </span>
            <span className="font-mono text-[13px] font-bold tracking-[0.3em] text-ice/50">
              CUMULATIVE
            </span>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {(["sec1", "sec2", "sec3", "sec4"] as const).map((id, i) => (
              <div key={id} className="flex items-center gap-4">
                <span className="w-full font-display text-[26px] font-black uppercase leading-none"
                  style={{ color: TEAM_COLORS[i] }}>
                  {["SEC 1", "SEC 2", "SEC 3", "SEC 4"][i]}
                </span>
                <span className="ml-auto font-display text-[44px] font-black tabular-nums text-ice">
                  {scores[id] ?? 0}
                </span>
              </div>
            ))}
          </div>
          <div className="barcode mt-5 h-8 w-full text-ice/30" />
        </motion.div>

        {/* floating shuttlecock deco */}
        <motion.div
          animate={{ y: [0, -22, 0], rotate: [0, 12, -8, 0] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -right-10 -top-16 font-display text-[150px] leading-none opacity-90"
        >
          🏸
        </motion.div>
      </div>

      {/* bottom ticker */}
      <div className="absolute inset-x-0 bottom-0 z-30">
        <TickerBand items={c.ticker} />
      </div>
    </SlideShell>
  );
}
