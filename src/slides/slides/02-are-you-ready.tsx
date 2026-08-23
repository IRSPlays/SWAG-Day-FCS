"use client";

/* 02 · ARE YOU READY? — Quad Cohort Stadium Clash.
   Massive full-bleed 4-pillar arena lineup with kinetic typography. */

import { motion } from "motion/react";
import SlideShell, { LiveBug, TickerBand } from "@/layouts/SlideShell";
import { LetterStagger, ClipWipeReveal } from "@/animations";
import { useSlideContent } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "are-you-ready",
  title: "02 · ARE YOU READY?",
  transition: "split-flap-reset",
  durationHint: 14,
  notes:
    "Energy spike — pump the house music to 85%! MC hypes up each cohort: Sec 1, Sec 2, Sec 3, Sec 4. Call each team out by name!",
  accent: "volt",
};

export const content = {
  kicker: "COHORT ROLL CALL",
  titleTop: "ARE YOU",
  titleBottom: "READY?",
  serif: "4 teams. 1 champion. All out spirit.",
  teams: [
    {
      id: "sec1",
      num: "01",
      name: "TITANS",
      cohort: "SEC 1",
      slogan: "DEFEND THE CROWN",
      color: "#23dcff",
      bg: "bg-[#23dcff]",
      text: "text-[#23dcff]",
    },
    {
      id: "sec2",
      num: "02",
      name: "CYCLONES",
      cohort: "SEC 2",
      slogan: "BRING THE NOISE",
      color: "#ff3da6",
      bg: "bg-[#ff3da6]",
      text: "text-[#ff3da6]",
    },
    {
      id: "sec3",
      num: "03",
      name: "VIPERS",
      cohort: "SEC 3",
      slogan: "STRIKE FAST",
      color: "#ffd23f",
      bg: "bg-[#ffd23f]",
      text: "text-[#ffd23f]",
    },
    {
      id: "sec4",
      num: "04",
      name: "APEX",
      cohort: "SEC 4 & STAFF",
      slogan: "UNSTOPPABLE",
      color: "#8f6bff",
      bg: "bg-[#8f6bff]",
      text: "text-[#8f6bff]",
    },
  ],
  ticker: [
    "SEC 1 TITANS",
    "SEC 2 CYCLONES",
    "SEC 3 VIPERS",
    "SEC 4 & STAFF APEX",
    "MAKE SOME NOISE",
    "ARENA LIVE",
    "SWAG DAY '26",
  ],
};

export default function AreYouReady() {
  const c = useSlideContent(meta.id, content);

  return (
    <SlideShell className="bg-[#06040d]">
      {/* top broadcast header */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between border-b-2 border-ice/10 bg-court/80 px-14 py-4 backdrop-blur-md">
        <div className="flex items-center gap-4 font-mono text-[16px] font-bold tracking-[0.35em] text-ice/80">
          <LiveBug label="ARENA LIVE" />
          <span>{c.kicker}</span>
        </div>
        <div className="font-mono text-[16px] font-bold tracking-[0.35em] text-volt">
          TEACHERS&apos; DAY &apos;26
        </div>
      </div>

      {/* 4 massive full-height cohort pillars */}
      <div className="absolute inset-x-0 top-[72px] bottom-[56px] z-10 grid grid-cols-4 divide-x-2 divide-ice/10">
        {c.teams.map((t, idx) => (
          <motion.div
            key={t.id}
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 + idx * 0.12, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="group relative flex h-full flex-col justify-between overflow-hidden p-10 transition-colors duration-500 hover:bg-white/[0.03]"
          >
            {/* huge background watermark jersey numeral */}
            <span
              className="pointer-events-none absolute -bottom-10 -right-6 select-none font-display text-[320px] font-black leading-none opacity-[0.06] transition-transform duration-700 group-hover:scale-110"
              style={{ color: t.color }}
            >
              {t.num}
            </span>

            {/* top pillar tag */}
            <div className="relative z-10 flex items-center justify-between">
              <span
                className="inline-block border-2 px-3 py-1 font-mono text-[13px] font-bold tracking-[0.3em]"
                style={{ borderColor: t.color, color: t.color }}
              >
                {t.cohort}
              </span>
              <span className="font-mono text-[20px] font-black tracking-widest text-ice/30">
                #{t.num}
              </span>
            </div>

            {/* center team name */}
            <div className="relative z-10 my-auto">
              <span className="block font-mono text-[14px] font-semibold tracking-[0.4em] text-ice/50">
                TEAM
              </span>
              <h2
                className="mt-1 font-display text-[84px] font-black uppercase leading-none tracking-tight"
                style={{ color: t.color }}
              >
                {t.name}
              </h2>
              <p className="mt-4 font-mono text-[13px] font-bold tracking-[0.3em] text-ice/70">
                {t.slogan}
              </p>
            </div>

            {/* bottom accent energy bar */}
            <div className="relative z-10">
              <div className="h-2 w-full overflow-hidden bg-ice/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.6 + idx * 0.15, duration: 1.2, ease: "easeOut" }}
                  className="h-full"
                  style={{ background: t.color }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* center massive floating title stamp */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block border-4 border-court bg-court/95 px-14 py-8 shadow-2xl backdrop-blur-xl"
        >
          <h1 className="font-display uppercase leading-[0.82] tracking-tighter text-ice">
            <span className="block text-[140px] text-ice">
              <LetterStagger text={c.titleTop} delay={0.4} />
            </span>
            <span className="block -skew-x-6 text-[170px] text-volt">
              <LetterStagger text={c.titleBottom} delay={0.65} />
            </span>
          </h1>
          <p className="mt-4 font-serifit text-[32px] italic text-ice/80">
            {c.serif}
          </p>
        </motion.div>
      </div>

      {/* bottom ticker */}
      <div className="absolute inset-x-0 bottom-0 z-30">
        <TickerBand items={c.ticker} />
      </div>
    </SlideShell>
  );
}
