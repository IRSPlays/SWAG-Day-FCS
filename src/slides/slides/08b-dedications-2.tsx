"use client";

/* 08B · DEDICATIONS FILLER #2 — while the band clears instruments.
    Second crowd-engagement moment straight from the emcee script: quick
    dedications from the crowd before the dance item. Fully passive. */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import SlideShell, { CourtLines, LiveBug } from "@/layouts/SlideShell";
import { LetterStagger, ClipWipeReveal } from "@/animations";
import { useSlideContent } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "dedications-2",
  title: "08b · Dedications — One More Round",
  transition: "slow-fade-black",
  durationHint: 90,
  notes:
    "Filler while the band clears instruments. Get 1-3 quick dedications from the crowd (ground ICs cut in when ready). Backstage signal = move on to the next performance.",
  accent: "volt",
};

export const content = {
  kicker: "WHILE THE BAND CLEARS UP",
  titleTop: "SPREAD THE",
  titleBottom: "LOVE",
  serif: "one more round — who would you thank?",
  questions: [
    "Which teacher has always cheered you on?",
    "Which teacher has inspired you the most?",
    "Is there a teacher you would like to thank?",
    "Which teacher do you think could be a sporting icon?",
    "Who is a teacher you would miss if they left?",
    "Which teacher can you spill tea to?",
  ],
  audienceHint: "PHONES: OPEN /AUDIENCE — REACT & DEDICATE",
};

export default function DedicationsFiller2() {
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
        <span className="font-mono text-[16px] font-bold tracking-[0.4em] text-volt">
          {c.kicker}
        </span>
      </div>

      <div className="relative z-10 grid h-full grid-cols-[1.15fr_1fr] items-center gap-14 px-16 pb-16 pt-24">
        <div>
          <h1 className="font-display uppercase leading-[0.84] tracking-tighter">
            <LetterStagger text={c.titleTop} delay={0.25} className="block text-[110px] text-ice" />
            <div className="block skew-x-[-6deg] text-[110px] text-volt">
              <LetterStagger text={c.titleBottom} delay={0.5} skewX={-6} />
            </div>
          </h1>
          <ClipWipeReveal delay={0.7}>
            <p className="mt-5 font-serifit text-[42px] italic text-ice/80">{c.serif}</p>
          </ClipWipeReveal>
        </div>

        <div className="relative flex h-[380px] items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={qi}
              initial={{ opacity: 0, y: 46, rotate: 1.5, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, rotate: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -40, rotate: -1.5, filter: "blur(8px)" }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="w-full border-2 border-volt/50 bg-panel/85 p-9 shadow-2xl"
            >
              <div className="font-mono text-[13px] font-bold tracking-[0.4em] text-volt">
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
