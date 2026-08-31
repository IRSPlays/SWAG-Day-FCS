"use client";

/* 04 · PRINCIPAL'S ADDRESS — Mr Kelly Tan's team talk.
    Editorial half-court layout: giant shout on the left, quiet serif
    brief on the right. Nothing centred — a coach's whiteboard moment. */

import { motion } from "motion/react";
import SlideShell, { CourtLines, LiveBug } from "@/layouts/SlideShell";
import { LetterStagger, ClipWipeReveal } from "@/animations";
import { useSlideContent } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "principal-address",
  title: "04 · Principal's Address — Mr Kelly Tan",
  transition: "whistle-cut",
  durationHint: 240,
  notes:
    "Razan invites Mr Kelly Tan up to address the school. He REMAINS on stage afterwards to present the awards. Usher in once speech is done.",
  accent: "volt",
};

export const content = {
  kicker: "PRINCIPAL'S ADDRESS · PUT YOUR HANDS TOGETHER",
  shout: "TEAM",
  shout2: "TALK",
  serif: "the man with the game plan —",
  name: "MR KELLY TAN",
  principal: "PRINCIPAL · ADMIRALTY SECONDARY SCHOOL",
  ticker: ["MR KELLY TAN", "PRINCIPAL'S ADDRESS", "SWAG DAY '26"],
};

export default function PrincipalAddress() {
  const c = useSlideContent(meta.id, content);

  return (
    <SlideShell>
      <CourtLines />

      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between border-b-2 border-ice/10 px-14 py-4">
        <LiveBug label="ON STAGE NOW" />
        <span className="font-mono text-[16px] font-bold tracking-[0.4em] text-volt">
          SPEECH · THEN AWARDS
        </span>
      </div>

      <div className="relative z-10 grid h-full grid-cols-[1.2fr_1fr] items-center gap-10 px-16 pb-16 pt-24">
        {/* left: the shout */}
        <div>
          <ClipWipeReveal delay={0.1} from="top">
            <span className="inline-block border-2 border-volt/60 bg-volt/10 px-5 py-2 font-mono text-[14px] font-bold tracking-[0.4em] text-volt">
              {c.kicker}
            </span>
          </ClipWipeReveal>
          <h1 className="mt-6 font-display uppercase leading-[0.82] tracking-tighter">
            <LetterStagger text={c.shout} delay={0.3} className="block text-[210px] text-ice" />
            <LetterStagger
              text={c.shout2}
              delay={0.55}
              className="block skew-x-[-6deg] text-[210px] text-volt"
            />
          </h1>
        </div>

        {/* right: the quiet brief */}
        <div className="border-l-4 border-volt pl-10">
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="font-serifit text-[46px] italic leading-tight text-ice/80"
          >
            {c.serif}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mt-4 font-display text-[76px] font-black uppercase leading-none tracking-tight text-ice">
              {c.name}
            </div>
            <div className="mt-3 font-mono text-[15px] font-bold tracking-[0.35em] text-volt">
              {c.principal}
            </div>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1.25, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 h-[3px] w-40 origin-left bg-volt"
            />
          </motion.div>
        </div>
      </div>

      {/* bottom-right corner annotation */}
      <div className="absolute bottom-10 right-14 z-20 font-mono text-[13px] font-bold tracking-[0.3em] text-ice/45">
        REMAIN ON STAGE FOR THE AWARDS →
      </div>
    </SlideShell>
  );
}
