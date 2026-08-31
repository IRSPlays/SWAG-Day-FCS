"use client";

/* 07 · DEDICATIONS FILLER — crowd engagement while the band sets up.
    Rotating prompt cards pulled straight from the emcee script's filler
    questions, plus a pointer to /audience on the phones. Fully passive. */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import SlideShell, { CourtLines, LiveBug } from "@/layouts/SlideShell";
import { LetterStagger, ClipWipeReveal } from "@/animations";
import { useSlideContent } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "dedications",
  title: "07 · Dedications — Spread the Love",
  transition: "slow-fade-black",
  durationHint: 90,
  notes:
    "Filler while the band sets up. Emcees share their own dedications, then fish 1-3 from the crowd (ground ICs cut in when ready). Survey can open on /audience.",
  accent: "mag",
};

export const content = {
  kicker: "WHILE THE BAND SETS UP",
  titleTop: "SPREAD THE",
  titleBottom: "LOVE",
  serif: "who deserves your thank-you today?",
  questions: [
    "Is there a teacher you would like to thank?",
    "Which teacher has always cheered you on?",
    "Which teacher has inspired you the most?",
    "Which teacher do you think could be a sporting icon?",
    "Who is a teacher you would miss if they left?",
    "Which teacher can you spill tea to?",
  ],
  audienceHint: "PHONES: OPEN /AUDIENCE — REACT & DEDICATE",
};

export default function DedicationsFiller() {
  const c = useSlideContent(meta.id, content);
  const [qi, setQi] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setQi((x) => (x + 1) % c.questions.length), 5200);
    return () => clearInterval(id);
  }, [c.questions.length]);

  return (
    <SlideShell>
      <CourtLines />

      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between border-b-2 border-ice/10 px-14 py-4">
        <LiveBug label="CROWD TIME" />
        <span className="font-mono text-[16px] font-bold tracking-[0.4em] text-mag">
          {c.kicker}
        </span>
      </div>

      <div className="relative z-10 grid h-full grid-cols-[1.15fr_1fr] items-center gap-14 px-16 pb-16 pt-24">
        {/* left: the title */}
        <div>
          <h1 className="font-display uppercase leading-[0.84] tracking-tighter">
            <LetterStagger text={c.titleTop} delay={0.25} className="block text-[110px] text-ice" />
            <div className="block skew-x-[-6deg] text-[110px] text-mag">
              <LetterStagger text={c.titleBottom} delay={0.5} skewX={-6} />
            </div>
          </h1>
          <ClipWipeReveal delay={0.7}>
            <p className="mt-5 font-serifit text-[42px] italic text-ice/80">{c.serif}</p>
          </ClipWipeReveal>
        </div>

        {/* right: rotating prompt cards */}
        <div className="relative flex h-[380px] items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={qi}
              initial={{ opacity: 0, y: 46, rotate: 1.5, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, rotate: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -40, rotate: -1.5, filter: "blur(8px)" }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="w-full border-2 border-mag/50 bg-panel/85 p-9 shadow-2xl"
            >
              <div className="font-mono text-[13px] font-bold tracking-[0.4em] text-mag">
                PROMPT {String(qi + 1).padStart(2, "0")}
              </div>
              <p className="mt-4 font-body text-[40px] font-bold leading-snug text-ice">
                “{c.questions[qi]}”
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="absolute bottom-10 right-14 z-20 font-mono text-[13px] font-bold tracking-[0.3em] text-ice/45">
        {c.audienceHint}
      </div>
    </SlideShell>
  );
}
