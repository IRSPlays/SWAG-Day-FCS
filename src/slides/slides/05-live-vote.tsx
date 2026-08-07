"use client";

/* 05 · LIVE VOTE — audience slide with live results bars. */

import SlideShell, { CourtLines } from "@/layouts/SlideShell";
import { LetterStagger, ClipWipeReveal, ScoreboardFlip } from "@/animations";
import { motion } from "motion/react";
import { useShow, useSlideContent } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "live-vote",
  title: "05 · Live Vote — MVP",
  transition: "baton-change",
  durationHint: 20,
  notes: "Open voting from the controller. Results reveal on stage when voting closes.",
  accent: "volt",
};

export const content = {
  kicker: "LIVE VOTE",
  titleTop: "FANS",
  titleBottom: "DECIDE.",
  serif: "scan the code. tap your MVP. crown them live.",
  qrNote: "AUDIENCE CODE — SCAN FROM YOUR SEAT",
  voteNote: "ONE PHONE · ONE VOTE",
  boardTitle: "TODAY'S MVP",
  boardHint: "TAP ON YOUR PHONE",
  footnote: "RESULTS REVEAL ON STAGE WHEN VOTING CLOSES",
  options: [
    { key: "A", name: "COACH AZLAN", sub: "THE SPRINT LEGEND" },
    { key: "B", name: "MRS. LIM", sub: "THE CAPTAIN" },
    { key: "C", name: "MR. DAVID", sub: "FULL-STACK MATHS" },
  ],
};

export default function LiveVote() {
  const c = useSlideContent(meta.id, content);
  const votes = useShow((s) => s.votes);
  const pollOpen = useShow((s) => s.pollOpen);
  const total = Object.values(votes).reduce((a, b) => a + b, 0);
  return (
    <SlideShell>
      <CourtLines />

      <div className="absolute left-16 top-[14%] z-10 max-w-[820px]">
        <ClipWipeReveal>
          <span className="inline-block -rotate-1 bg-mag px-5 py-2 font-body text-[24px] font-bold tracking-[0.4em] text-ice">
            {c.kicker}
          </span>
        </ClipWipeReveal>

        <h2 className="mt-8 font-display uppercase leading-[0.88]">
          <LetterStagger text={c.titleTop} delay={0.12} className="block text-[168px] text-ice" />
          <LetterStagger text={c.titleBottom} delay={0.34} className="block text-[168px] text-volt" />
        </h2>

        <ClipWipeReveal delay={0.8} from="left">
          <p className="mt-8 font-serifit text-[46px] italic leading-tight text-vio">{c.serif}</p>
        </ClipWipeReveal>

        <ClipWipeReveal delay={1.05}>
          <div className="mt-10 flex h-[190px] w-[190px] flex-col items-center justify-center gap-2 border-4 border-dashed border-ice/30">
            <span className="font-display text-[40px] leading-none text-ice/70">QR</span>
            <span className="px-3 text-center font-body text-[14px] font-bold tracking-[0.14em] text-ice/45">
              {c.qrNote}
            </span>
          </div>
        </ClipWipeReveal>
        <p className="mt-4 font-body text-[20px] font-bold tracking-[0.3em] text-ice/40">{c.voteNote}</p>
      </div>

      <div className="absolute right-16 top-1/2 z-10 w-[860px] -translate-y-1/2">
        <div className="mb-5 flex items-center justify-between">
          <span className="font-body text-[22px] font-bold tracking-[0.4em] text-ice/50">{c.boardTitle}</span>
          <span className={`font-body text-[22px] font-bold tracking-[0.4em] ${pollOpen ? "text-mag" : "text-volt"}`}>
            {pollOpen ? "● VOTING OPEN" : c.boardHint}
          </span>
        </div>
        <ScoreboardFlip
          delay={0.55}
          stagger={0.14}
          items={c.options.map((o) => {
            const n = votes[o.key] ?? 0;
            const pct = total > 0 ? Math.round((n / total) * 100) : 0;
            return {
              key: o.key,
              node: (
                <div className="mb-5 border-2 border-ice/12 bg-panel px-8 py-6">
                  <div className="flex items-center gap-8">
                    <span className="grid h-[84px] w-[84px] shrink-0 place-items-center bg-volt font-display text-[52px] text-court">
                      {o.key}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="truncate font-display text-[52px] uppercase leading-none text-ice">
                          {o.name}
                        </span>
                        {pollOpen && (
                          <span className="font-display text-[44px] leading-none text-volt tabular-nums">
                            {pct}%
                          </span>
                        )}
                      </div>
                      <div className="mt-2 font-body text-[21px] font-medium tracking-[0.26em] text-ice/50">
                        {o.sub}
                      </div>
                    </div>
                  </div>
                  {pollOpen && (
                    <div className="mt-4 h-3 w-full bg-ice/10">
                      <motion.div
                        className="h-full bg-volt"
                        animate={{ width: `${pct}%` }}
                        transition={{ type: "spring", stiffness: 120, damping: 22 }}
                      />
                    </div>
                  )}
                </div>
              ),
            };
          })}
        />
        <p className="font-body text-[19px] font-bold tracking-[0.24em] text-ice/40">{c.footnote}</p>
      </div>
    </SlideShell>
  );
}