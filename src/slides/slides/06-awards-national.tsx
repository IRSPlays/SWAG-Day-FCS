"use client";

/* 06 · NATIONAL AWARD RECIPIENTS — honour roll.
    Three award blocks (Commendation Medal · Long Service ×5 · Excellence
    in Mathematics Teaching) revealed block by block on the right arrow,
    matching the emcee script's cadence. Mr Kelly Tan presents. */

import { useState } from "react";
import { motion } from "motion/react";
import SlideShell, { CourtLines, LiveBug, TickerBand } from "@/layouts/SlideShell";
import { LetterStagger, ClipWipeReveal } from "@/animations";
import { useSlideContent } from "@/store/show";
import { useSlideAction } from "@/engine/advance";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "awards-national",
  title: "06 · National Award Recipients",
  transition: "whistle-cut",
  durationHint: 300,
  notes:
    "Razan reads the awards; Mr Kelly Tan presents. PRESS → per block: 1) Commendation Medal (Ms Uma) 2) Long Service ×5 (wait for each to exit stage) 3) Excellence in Mathematics Teaching (Ms Diyana).",
  accent: "vio",
};

export const content = {
  kicker: "2026 NATIONAL AWARDS · PRESENTED BY MR KELLY TAN",
  titleTop: "NATIONAL",
  titleBottom: "HONOURS",
  blocks: [
    {
      name: "COMMENDATION MEDAL",
      people: ["Ms Uma d/o Madawan"],
    },
    {
      name: "LONG SERVICE AWARD",
      people: [
        "Mr Phua Tian Peng",
        "Mdm Kuek May Lin Florence",
        "Mdm Tamil Selvi d/o Ramanujam",
        "Mdm Yam Chaur Sin",
        "Mr Goh Hock Meng",
      ],
    },
    {
      name: "EXCELLENCE IN MATHEMATICS TEACHING",
      people: ["Ms Diyana Jumahat"],
    },
  ],
  ticker: [
    "NATIONAL AWARDS",
    "CONGRATULATIONS RECIPIENTS",
    "THANK YOU MR KELLY TAN",
    "SWAG DAY '26",
  ],
};

const GOLD = "#e1811f";

export default function AwardsNational() {
  const c = useSlideContent(meta.id, content);
  const [shown, setShown] = useState(0);
  const total = c.blocks.reduce((n, b) => n + b.people.length, 0);

  /* right arrow = reveal the next block of honourees */
  useSlideAction(() => {
    if (shown < c.blocks.length) {
      setShown(shown + 1);
      return true;
    }
    return false;
  });

  return (
    <SlideShell>
      <CourtLines />

      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between border-b-2 border-ice/10 px-14 py-4">
        <LiveBug label="AWARDS LIVE" />
        <span className="font-mono text-[16px] font-bold tracking-[0.4em]" style={{ color: GOLD }}>
          {c.blocks.slice(0, shown).reduce((n, b) => n + b.people.length, 0)}/{total} HONOURED
        </span>
      </div>

      <div className="relative z-10 grid h-full grid-cols-[0.9fr_1.35fr] items-center gap-12 px-16 pb-20 pt-24">
        {/* left: title */}
        <div>
          <ClipWipeReveal delay={0.1} from="top">
            <span
              className="inline-block border-2 px-5 py-2 font-mono text-[13px] font-bold tracking-[0.35em]"
              style={{ borderColor: `${GOLD}88`, color: GOLD }}
            >
              {c.kicker}
            </span>
          </ClipWipeReveal>
          <h1 className="mt-6 font-display uppercase leading-[0.84] tracking-tighter">
            <LetterStagger text={c.titleTop} delay={0.3} className="block text-[120px] text-ice" />
            <div className="block skew-x-[-6deg] text-[120px]" style={{ color: GOLD }}>
              <LetterStagger text={c.titleBottom} delay={0.55} skewX={-6} />
            </div>
          </h1>
        </div>

        {/* right: the honour roll, block by block */}
        <div className="flex flex-col gap-6">
          {c.blocks.map((block, bi) => {
            const shownYet = bi < shown;
            return (
              <motion.div
                key={block.name}
                initial={false}
                animate={
                  shownYet
                    ? { opacity: 1, x: 0, filter: "blur(0px)" }
                    : { opacity: 0, x: 60, filter: "blur(8px)" }
                }
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="border-2 bg-panel/80 p-5"
                style={{ borderColor: shownYet && bi === shown - 1 ? GOLD : `${GOLD}44` }}
              >
                <div
                  className="font-mono text-[14px] font-bold tracking-[0.35em]"
                  style={{ color: GOLD }}
                >
                  {block.name}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2">
                  {block.people.map((p, pi) => (
                    <motion.span
                      key={p}
                      initial={{ opacity: 0, y: 14 }}
                      animate={shownYet ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
                      transition={{
                        delay: shownYet ? 0.25 + pi * 0.35 : 0,
                        duration: 0.5,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="font-body text-[27px] font-bold tracking-[0.02em] text-ice"
                    >
                      {p}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-30">
        <TickerBand items={c.ticker} />
      </div>
    </SlideShell>
  );
}
