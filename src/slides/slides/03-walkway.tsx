"use client";

/* 03 · THE WALKWAY — teachers walk the aisle, class by class.
   Normal walkway (no sports showcase). Script: "Play 'Count on Me'
   when Teachers Walk in" — driven by the RIGHT ARROW:
   press 1 → track starts · press 2 → song fades out, next cue. */

import { useRef, useState } from "react";
import { motion } from "motion/react";
import SlideShell, { LiveBug, TickerBand } from "@/layouts/SlideShell";
import { LetterStagger } from "@/animations";
import { useSlideContent } from "@/store/show";
import { useSlideAction, useMuted } from "@/engine/advance";
import type { SlideMeta } from "../types";

/* singleton so the fade-out survives the slide unmounting */
let walkAudio: HTMLAudioElement | null = null;
function getWalkAudio(): HTMLAudioElement {
  if (!walkAudio) {
    walkAudio = new Audio("/audio/count-on-me.flac");
    walkAudio.loop = true;
    walkAudio.preload = "auto";
  }
  return walkAudio;
}

export const meta: SlideMeta = {
  id: "walkway",
  title: "03 · The Walkway",
  transition: "track-sweep",
  durationHint: 600,
  notes:
    "Teachers walk the aisle front to back. PRESS → (1st): 'Count on Me' starts. PRESS → (2nd) when the walkway is done: the song fades out and the show moves on.",
  accent: "mag",
};

export const content = {
  kicker: "THE WALKWAY",
  titleTop: "OUR COACHES",
  titleBottom: "ON THE WALK",
  promptLeft: "GIVE IT UP FOR",
  promptRight: "OUR COACHES!",
  looks: ["CLASS BY CLASS", "FRONT TO BACK", "MAKE SOME NOISE"],
  ticker: [
    "THE WALKWAY",
    "GIVE IT UP FOR OUR TEACHERS",
    "TEACHERS ON THE WALK",
    "MAKE SOME NOISE",
    "SWAG DAY '26",
  ],
};

export default function Walkway() {
  const c = useSlideContent(meta.id, content);
  const muted = useMuted();
  const [started, setStarted] = useState(false);
  const fadingRef = useRef(false);

  /* RIGHT ARROW — press 1: "Count on Me" starts · press 2: the song fades
     out and the deck moves on (the singleton audio keeps fading after the
     slide unmounts). */
  useSlideAction(() => {
    if (muted) return true; /* muted monitor: never skip the walkway cue */
    if (!started) {
      const a = getWalkAudio();
      a.volume = 0.9;
      void a.play().catch(() => {});
      setStarted(true);
      return true;
    }
    if (!fadingRef.current) {
      fadingRef.current = true;
      const a = getWalkAudio();
      const iv = setInterval(() => {
        const v = Math.max(0, a.volume - 0.025);
        a.volume = v;
        if (v <= 0) {
          a.pause();
          a.volume = 0.9; /* reset for the next show run */
          clearInterval(iv);
        }
      }, 80);
    }
    return false; /* the fade continues while the next cue comes in */
  });

  return (
    <SlideShell>
      {/* ---------- vanishing-point runway floor (full bleed) ---------- */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-[104px] top-[90px] z-0 overflow-hidden"
        style={{ perspective: "700px" }}
      >
        {/* the runway plane receding to the horizon */}
        <motion.div
          initial={{ rotateX: 0 }}
          animate={{ rotateX: 62 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-x-[-60%] bottom-[-10%] h-[160%] origin-bottom"
          style={{
            background:
              "repeating-linear-gradient(0deg, rgba(234,58,58,0.16) 0 6px, transparent 6px 110px), linear-gradient(to bottom, rgba(225,129,31,0.10), rgba(234,58,58,0.22))",
            transformStyle: "preserve-3d",
          }}
        />
        {/* side lane chevrons */}
        <motion.div
          animate={{ opacity: [0.35, 0.7, 0.35] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-0 h-full w-[420px] -translate-x-1/2"
          style={{
            clipPath: "polygon(46% 0, 54% 0, 92% 100%, 8% 100%)",
            borderLeft: "3px solid rgba(225,129,31,0.5)",
            borderRight: "3px solid rgba(225,129,31,0.5)",
            background:
              "linear-gradient(to bottom, rgba(225,129,31,0.06), rgba(234,58,58,0.14))",
          }}
        />
        {/* horizon glow */}
        <div
          className="absolute inset-x-0 top-0 h-40"
          style={{
            background:
              "radial-gradient(60% 100% at 50% 0%, rgba(234,58,58,0.35), transparent 70%)",
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

      {/* centred title floating over the runway */}
      <div className="pointer-events-none absolute inset-x-0 top-[16%] z-10 text-center">
        <motion.h1
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="font-display uppercase leading-[0.84] tracking-tighter"
        >
          <span className="block text-[120px] text-ice drop-shadow-[0_6px_24px_rgba(0,0,0,0.8)]">
            <LetterStagger text={c.titleTop} delay={0.35} />
          </span>
          <span className="block skew-x-[-6deg] text-[86px] text-mag drop-shadow-[0_6px_24px_rgba(0,0,0,0.8)]">
            {c.titleBottom}
          </span>
        </motion.h1>
      </div>

      {/* crowd-game prompts pinned mid-left and mid-right over the runway */}
      <motion.div
        initial={{ x: -70, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="absolute left-12 top-[52%] z-20 -rotate-2 border-l-8 border-volt bg-court/85 px-6 py-4 backdrop-blur-md"
      >
        <div className="font-mono text-[13px] font-bold tracking-[0.35em] text-volt">MC ASKS</div>
        <div className="mt-1 font-display text-[36px] font-black uppercase leading-none text-ice">
          {c.promptLeft}
        </div>
      </motion.div>
      <motion.div
        initial={{ x: 70, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 1.05, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="absolute right-12 top-[58%] z-20 rotate-2 border-l-8 border-mag bg-court/85 px-6 py-4 backdrop-blur-md"
      >
        <div className="font-mono text-[13px] font-bold tracking-[0.35em] text-mag">HALL ANSWERS</div>
        <div className="mt-1 font-display text-[44px] font-black uppercase leading-none text-mag">
          {c.promptRight}
        </div>
      </motion.div>

      {/* bottom look strip above the ticker */}
      <div className="absolute inset-x-0 bottom-[104px] z-20 flex justify-center gap-4 px-10">
        {c.looks.map((look, idx) => (
          <motion.span
            key={look}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.2 + idx * 0.15, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className={`border px-5 py-2 font-mono text-[14px] font-bold tracking-[0.22em] backdrop-blur-md ${
              idx === c.looks.length - 1
                ? "border-mag bg-mag/20 text-mag"
                : "border-ice/25 bg-court/80 text-ice/75"
            }`}
          >
            {look}
          </motion.span>
        ))}
      </div>

      {/* bottom ticker */}
      <div className="absolute inset-x-0 bottom-0 z-30">
        <TickerBand items={c.ticker} />
      </div>
    </SlideShell>
  );
}
