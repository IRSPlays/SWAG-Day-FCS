"use client";

/* 03 · THE WALKWAY: SPORTS EDITION — runway beat, teachers walk the aisle.
    High-fashion split runway visual with team cheer-off slabs. */

import { motion } from "motion/react";
import SlideShell, { LiveBug, TickerBand } from "@/layouts/SlideShell";
import { LetterStagger, ClipWipeReveal } from "@/animations";
import { useSlideContent } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "walkway",
  title: "03 · The Walkway — Sports Edition",
  transition: "track-sweep",
  durationHint: 600,
  notes:
    "Runway of Champions! High-fashion beat up. Teachers walk the aisle front to back. MCs run the 'what sport is this?' crowd game between walks — keep this slide up the whole segment.",
  accent: "mag",
};

export const content = {
  kicker: "RUNWAY OF CHAMPIONS",
  titleTop: "THE",
  titleBottom: "WALKWAY",
  serif: "Teachers own the aisle. Sport it up!",
  prompt: "WHAT SPORT IS IT? SCREAM YES!",
  sports: [
    { tag: "LOOK 01", sport: "BADMINTON", cue: "SCREAM YES!" },
    { tag: "LOOK 02", sport: "BASKETBALL", cue: "MAKE SOME NOISE" },
    { tag: "LOOK 03", sport: "FOOTBALL", cue: "GOOOAL" },
    { tag: "FINAL LOOK", sport: "FULL SWAG KIT", cue: "ON YOUR FEET" },
  ],
  ticker: [
    "THE RUNWAY OF CHAMPIONS",
    "SUIT UP! SHOW UP! SPORT IT UP!",
    "TEACHERS ON THE CATWALK",
    "MAKE SOME NOISE",
    "SWAG DAY '26",
  ],
};

export default function Walkway() {
  const c = useSlideContent(meta.id, content);

  return (
    <SlideShell className="bg-[#0a0410]">
      {/* glowing runway strip down the middle of the frame */}
      <div className="pointer-events-none absolute inset-0 z-0 flex justify-center">
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="h-full w-[340px] origin-top bg-gradient-to-b from-mag/40 via-vio/15 to-transparent"
          style={{ clipPath: "polygon(18% 0, 82% 0, 100% 100%, 0 100%)" }}
        />
        <div
          className="absolute top-0 h-full w-[340px] opacity-60"
          style={{
            clipPath: "polygon(18% 0, 82% 0, 100% 100%, 0 100%)",
            background:
              "repeating-linear-gradient(0deg, transparent 0 60px, rgba(255,255,255,0.08) 60px 64px)",
          }}
        />
      </div>

      {/* top broadcast header */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between border-b-2 border-ice/10 bg-court/80 px-14 py-4 backdrop-blur-md">
        <div className="flex items-center gap-4 font-mono text-[16px] font-bold tracking-[0.35em] text-ice/80">
          <LiveBug label="CATWALK LIVE" />
          <span>{c.kicker}</span>
        </div>
        <div className="font-mono text-[16px] font-bold tracking-[0.35em] text-volt">
          TEACHERS&apos; DAY &apos;26
        </div>
      </div>

      {/* left: giant typography */}
      <div className="absolute left-16 top-[20%] z-10 max-w-[900px]">
        <ClipWipeReveal delay={0.1}>
          <div className="inline-block -rotate-2 border-2 border-mag bg-mag/20 px-5 py-2 font-mono text-[15px] font-bold tracking-[0.4em] text-mag backdrop-blur-md">
            {c.kicker}
          </div>
        </ClipWipeReveal>

        <h1 className="mt-4 font-display uppercase leading-[0.82] tracking-tighter text-ice">
          <span className="block text-[170px]">
            <LetterStagger text={c.titleTop} delay={0.25} />
          </span>
          <span className="block -skew-x-6 text-[190px] text-mag">
            <LetterStagger text={c.titleBottom} delay={0.45} />
          </span>
        </h1>

        <ClipWipeReveal delay={0.7} from="left">
          <p className="mt-3 font-serifit text-[40px] italic text-ice/85">{c.serif}</p>
        </ClipWipeReveal>

        <ClipWipeReveal delay={0.95}>
          <div className="mt-7 inline-block border-l-8 border-volt bg-panel/90 px-6 py-3 backdrop-blur-md">
            <div className="font-mono text-[13px] font-bold tracking-[0.35em] text-volt">
              CROWD GAME
            </div>
            <div className="mt-1 font-display text-[30px] font-black uppercase tracking-wide text-ice">
              {c.prompt}
            </div>
          </div>
        </ClipWipeReveal>
      </div>

      {/* right: the look cards */}
      <div className="absolute right-14 top-[16%] z-10 flex w-[560px] flex-col gap-5">
        {c.sports.map((s, idx) => (
          <motion.div
            key={s.tag}
            initial={{ x: 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 + idx * 0.22, duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className={`relative overflow-hidden border-l-8 bg-panel/90 px-7 py-5 shadow-2xl backdrop-blur-xl ${
              idx === c.sports.length - 1 ? "border-mag" : "border-volt"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[13px] font-bold tracking-[0.35em] text-ice/50">
                {s.tag}
              </span>
              <span className="font-mono text-[13px] font-bold tracking-[0.3em] text-mag">
                {s.cue}
              </span>
            </div>
            <div className="mt-2 font-display text-[56px] font-black uppercase leading-none tracking-tight text-ice">
              {s.sport}
            </div>
            {/* equalizer strip */}
            <div className="mt-4 flex h-2 items-end gap-1">
              {Array.from({ length: 24 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ scaleY: [0.25, 1, 0.4, 0.9, 0.2] }}
                  transition={{
                    duration: 0.55 + (i % 4) * 0.13,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: (i % 6) * 0.07,
                  }}
                  className="h-full w-full origin-bottom rounded-sm"
                  style={{ background: idx === c.sports.length - 1 ? "#ff3da6" : "#23dcff" }}
                />
              ))}
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
