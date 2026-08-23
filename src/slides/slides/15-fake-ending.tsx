"use client";

/* 15 · FAKE THE END & THEATRICAL POWER-CUT GLITCH.
   Starts as a polite concert outro, then suddenly triggers a dramatic power outage & 3-2-1 countdown! */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import SlideShell, { CourtLines } from "@/layouts/SlideShell";
import { LetterStagger, ClipWipeReveal } from "@/animations";
import { useSlideContent } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "fake-ending",
  title: "15 · Fake The End — Power Glitch",
  transition: "slow-fade-black",
  durationHint: 18,
  notes:
    "THEATRICAL SURPRISE! Starts polite: 'Thank you'. After 4s, lights cut out, sirens sound, 3-2-1 countdown triggers surprise PSG dance!",
  accent: "mag",
};

export const content = {
  calmTitle: "THANK YOU",
  calmSerif: "Thank you for coaching us in sport, and in life.",
  calmFooter: "SWAG DAY '26 · TEACHERS' DAY FINALE",
  glitchSubtitle: "SYSTEM OVERRIDE · UNEXPECTED SIGNAL",
  glitchTitleTop: "WAIT... NOT",
  glitchTitleBottom: "OVER YET!",
};

export default function FakeEnding() {
  const c = useSlideContent(meta.id, content);
  const [glitched, setGlitched] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    /* trigger glitch after 4.2 seconds */
    const t = setTimeout(() => setGlitched(true), 4200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!glitched) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [glitched]);

  return (
    <SlideShell className={glitched ? "bg-[#0a0005]" : "bg-[#05030c]"}>
      <CourtLines />

      <AnimatePresence mode="wait">
        {!glitched ? (
          /* CALM FAKE OUTRO */
          <motion.div
            key="calm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex h-full flex-col items-center justify-center px-16 text-center"
          >
            <div className="inline-block border-2 border-ice/20 bg-court/80 px-6 py-2 font-mono text-[14px] font-bold tracking-[0.4em] text-ice/70 backdrop-blur-md">
              {c.calmFooter}
            </div>

            <h1 className="mt-8 font-display text-[180px] font-black uppercase leading-none tracking-tight text-ice">
              {c.calmTitle}
            </h1>

            <p className="mt-6 font-serifit text-[44px] italic text-ice/80">
              {c.calmSerif}
            </p>
          </motion.div>
        ) : (
          /* THEATRICAL POWER-CUT GLITCH */
          <motion.div
            key="glitch"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-20 flex h-full flex-col items-center justify-center px-16 text-center"
          >
            {/* flashing red warning banner */}
            <motion.div
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ repeat: Infinity, duration: 0.4 }}
              className="inline-block border-4 border-mag bg-mag/20 px-8 py-3 font-mono text-[20px] font-black tracking-[0.4em] text-mag shadow-2xl backdrop-blur-xl"
            >
              ⚠ {c.glitchSubtitle} ⚠
            </motion.div>

            {/* gigantic glitch typography */}
            <h1 className="mt-6 font-display uppercase leading-[0.82] tracking-tighter text-ice">
              <span className="block text-[150px]">
                <LetterStagger text={c.glitchTitleTop} delay={0.1} />
              </span>
              <span className="block -skew-x-6 text-[180px] text-mag">
                <LetterStagger text={c.glitchTitleBottom} delay={0.3} />
              </span>
            </h1>

            {/* massive kinetic countdown numeral */}
            <div className="mt-6 flex flex-col items-center gap-2">
              <span className="font-mono text-[16px] font-bold tracking-[0.35em] text-volt">
                PARENT SUPPORT GROUP TAKES THE STAGE IN
              </span>
              <motion.div
                key={countdown}
                initial={{ scale: 1.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="font-display text-[200px] font-black leading-none text-volt"
              >
                {countdown > 0 ? countdown : "GO!"}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SlideShell>
  );
}
