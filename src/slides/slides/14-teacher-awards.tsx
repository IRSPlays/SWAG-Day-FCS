"use client";

/* 14 · HONOR & RECOGNITION — Teacher Awards presentation.
    Triumphant award-show visual: gold seal, spotlight beam, winner slabs. */

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
  kicker: "HONOR & RECOGNITION",
  titleTop: "TEACHER",
  titleBottom: "AWARDS",
  serif: "For the ones who make it all happen.",
  spotlightLabel: "SPOTLIGHT ON",
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
    <SlideShell className="bg-[#0a0503]">
      <CourtLines />

      {/* top broadcast header */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between border-b-2 border-ice/10 bg-court/80 px-14 py-4 backdrop-blur-md">
        <div className="flex items-center gap-4 font-mono text-[16px] font-bold tracking-[0.35em] text-ice/80">
          <LiveBug label="AWARDS LIVE" />
          <span>{c.kicker}</span>
        </div>
        <div className="font-mono text-[16px] font-bold tracking-[0.35em]" style={{ color: GOLD }}>
          TRIUMPHANT MODE
        </div>
      </div>

      {/* spotlight beams from the top corners */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.1, 0.35, 0.1] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -top-40 left-[6%] z-0 h-[140%] w-[420px] rotate-[14deg]"
        style={{
          background: `linear-gradient(to bottom, ${GOLD}55, transparent 70%)`,
          clipPath: "polygon(42% 0, 58% 0, 100% 100%, 0 100%)",
          filter: "blur(8px)",
        }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.35, 0.1, 0.35] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -top-40 right-[6%] z-0 h-[140%] w-[420px] -rotate-[14deg]"
        style={{
          background: `linear-gradient(to bottom, ${GOLD}55, transparent 70%)`,
          clipPath: "polygon(42% 0, 58% 0, 100% 100%, 0 100%)",
          filter: "blur(8px)",
        }}
      />

      {/* left: giant gold typography */}
      <div className="absolute left-16 top-[20%] z-10 max-w-[960px]">
        <ClipWipeReveal delay={0.1}>
          <div
            className="inline-block -rotate-2 border-2 bg-black/30 px-5 py-2 font-mono text-[15px] font-bold tracking-[0.4em] backdrop-blur-md"
            style={{ borderColor: GOLD, color: GOLD }}
          >
            {c.kicker}
          </div>
        </ClipWipeReveal>

        <h1 className="mt-4 font-display uppercase leading-[0.82] tracking-tighter text-ice">
          <span className="block text-[165px]">
            <LetterStagger text={c.titleTop} delay={0.25} />
          </span>
          <span
            className="block text-[190px]"
            style={{ color: GOLD, transform: "skewX(-6deg)" }}
          >
            <LetterStagger text={c.titleBottom} delay={0.45} />
          </span>
        </h1>

        <ClipWipeReveal delay={0.7} from="left">
          <p className="mt-3 font-serifit text-[42px] italic text-ice/85">{c.serif}</p>
        </ClipWipeReveal>

        <ClipWipeReveal delay={0.9}>
          <div className="mt-7 inline-flex items-center gap-4 border-l-8 px-6 py-3 backdrop-blur-md"
            style={{ borderColor: GOLD, background: "rgba(0,0,0,0.5)" }}>
            <span className="font-mono text-[13px] font-bold tracking-[0.35em]" style={{ color: GOLD }}>
              {c.spotlightLabel}
            </span>
            <span className="font-display text-[26px] font-black uppercase tracking-wide text-ice">
              AS EACH NAME IS CALLED
            </span>
          </div>
        </ClipWipeReveal>
      </div>

      {/* right: award cards */}
      <div className="absolute right-14 top-[17%] z-10 flex w-[600px] flex-col gap-6">
        {c.awards.map((a, idx) => (
          <motion.div
            key={a.name}
            initial={{ x: 80, opacity: 0, scale: 0.96 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 + idx * 0.22, duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden border-2 bg-panel/90 p-7 shadow-2xl backdrop-blur-xl"
            style={{ borderColor: `${GOLD}66` }}
          >
            {/* shine sweep */}
            <motion.div
              animate={{ x: ["-120%", "160%"] }}
              transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 2.4 + idx * 0.5, ease: "easeInOut" }}
              className="pointer-events-none absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            />
            <div className="flex items-center gap-6">
              <span className="text-[64px] leading-none">{a.icon}</span>
              <div>
                <div
                  className="font-display text-[44px] font-black uppercase leading-none tracking-tight"
                  style={{ color: GOLD }}
                >
                  {a.name}
                </div>
                <div className="mt-2 font-mono text-[13px] font-bold tracking-[0.28em] text-ice/60">
                  {a.sub}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* bottom ticker */}
      <div className="absolute inset-x-0 bottom-0 z-30">
        <TickerBand items={c.ticker} />
      </div>
    </SlideShell>
  );
}
