"use client";

/* 14 · HONOR & RECOGNITION — Teacher Awards presentation.
   Award-show stage: single centred gold medallion + ribbon-arched
   laurels. Completely different silhouette from the side-panel slides. */

import { motion } from "motion/react";
import SlideShell, { CourtLines, LiveBug, TickerBand } from "@/layouts/SlideShell";
import { LetterStagger, ClipWipeReveal } from "@/animations";
import { useSlideContent } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "teacher-awards",
  title: "14 · Honor & Recognition — Teacher Awards",
  transition: "whistle-cut",
  durationHint: 300,
  notes:
    "Award ceremony! Triumphant music up. Spotlight each recipient as they're announced. Keep this slide up the whole segment; drive per-award from /editor if needed.",
  accent: "mag",
};

export const content = {
  kicker: "HONOR & RECOGNITION · 1020 — 1025",
  titleTop: "TEACHER",
  titleBottom: "AWARDS",
  serif: "For the ones who make it all happen.",
  awards: [
    { icon: "🏆", name: "COACH OF THE YEAR", sub: "THE ONE WHO NEVER STOPS BELIEVING" },
    { icon: "⭐", name: "SUPERSTAR EDUCATOR", sub: "LESSONS THAT FEEL LIKE HEADLINERS" },
    { icon: "💛", name: "HEART OF THE SCHOOL", sub: "KINDNESS IN EVERY WHISTLE CALL" },
  ],
  ticker: [
    "TEACHER AWARDS",
    "GIVE IT UP FOR OUR TEACHERS",
    "STANDING OVATION",
    "SWAG DAY '26",
  ],
};

const GOLD = "#ffd23f";

export default function TeacherAwards() {
  const c = useSlideContent(meta.id, content);

  return (
    <SlideShell className="bg-[#0a0603]">
      <CourtLines />

      {/* top live bug */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between border-b-2 border-ice/10 px-14 py-4">
        <LiveBug label="AWARDS LIVE" />
        <span className="font-mono text-[16px] font-bold tracking-[0.4em]" style={{ color: GOLD }}>
          TRIUMPHANT MODE
        </span>
      </div>

      {/* spotlight cones from top centre */}
      <motion.div
        animate={{ opacity: [0.15, 0.4, 0.15] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -top-32 left-1/2 z-0 h-[130%] w-[900px] -translate-x-1/2"
        style={{
          background: `linear-gradient(to bottom, ${GOLD}40, transparent 65%)`,
          clipPath: "polygon(38% 0, 62% 0, 100% 100%, 0 100%)",
          filter: "blur(10px)",
        }}
      />

      {/* centred ceremonial stack */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-16 pb-16 pt-20 text-center">
        <ClipWipeReveal delay={0.1} from="top">
          <span
            className="inline-block border-2 bg-black/30 px-6 py-2 font-mono text-[14px] font-bold tracking-[0.45em] backdrop-blur-md"
            style={{ borderColor: `${GOLD}88`, color: GOLD }}
          >
            {c.kicker}
          </span>
        </ClipWipeReveal>

        {/* medallion + titles */}
        <div className="relative mt-6">
          {/* rotating laurel ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
            className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed opacity-30"
            style={{ borderColor: GOLD }}
          />
          <h1 className="font-display uppercase leading-[0.84] tracking-tighter">
            <LetterStagger text={c.titleTop} delay={0.25} className="block text-[120px] text-ice" />
            <LetterStagger
              text={c.titleBottom}
              delay={0.45}
              className="block text-[150px]"
              // gold via per-letter span colouring below
            />
          </h1>
          {/* gold overlay for the second line */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-[-6px] select-none font-display text-[150px] uppercase leading-[0.84] tracking-tighter"
            style={{ color: GOLD, clipPath: "inset(55% 0 0 0)", transform: "skewX(-0deg)" }}
          >
            AWARDS
          </span>
        </div>

        <ClipWipeReveal delay={0.7}>
          <p className="mt-8 font-serifit text-[44px] italic text-ice/85">{c.serif}</p>
        </ClipWipeReveal>

        {/* the three awards as a horizontal medal row */}
        <div className="mt-12 flex items-stretch justify-center gap-8">
          {c.awards.map((a, idx) => (
            <motion.div
              key={a.name}
              initial={{ y: 90, rotate: idx === 1 ? 0 : idx === 0 ? -3 : 3, opacity: 0 }}
              animate={{ y: 0, rotate: idx === 1 ? 0 : idx === 0 ? -2 : 2, opacity: 1 }}
              transition={{ delay: 0.9 + idx * 0.22, duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
              className={`relative w-[430px] overflow-hidden border-2 bg-panel/90 p-7 shadow-2xl backdrop-blur-xl ${
                idx === 1 ? "-mt-6 pb-11" : ""
              }`}
              style={{ borderColor: `${GOLD}66` }}
            >
              {/* shine sweep */}
              <motion.div
                animate={{ x: ["-130%", "170%"] }}
                transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 2.2 + idx * 0.6, ease: "easeInOut" }}
                className="pointer-events-none absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/12 to-transparent"
              />
              <div className="flex flex-col items-center gap-3">
                <span
                  className="grid h-20 w-20 place-items-center rounded-full border-4 text-[40px]"
                  style={{ borderColor: GOLD, background: "rgba(0,0,0,0.35)" }}
                >
                  {a.icon}
                </span>
                <div
                  className="font-display text-[34px] font-black uppercase leading-none tracking-tight"
                  style={{ color: GOLD }}
                >
                  {a.name}
                </div>
                <div className="font-mono text-[12px] font-bold tracking-[0.25em] text-ice/60">
                  {a.sub}
                </div>
                <span className="mt-1 h-1.5 w-16" style={{ background: GOLD }} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* bottom ticker */}
      <div className="absolute inset-x-0 bottom-0 z-30">
        <TickerBand items={c.ticker} />
      </div>
    </SlideShell>
  );
}
