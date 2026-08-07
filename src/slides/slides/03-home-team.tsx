"use client";

/* 03 · THE HOME TEAM — starting-lineup reveals, split-flap style.
   Swap names freely — this file is the roster's source of truth. */

import SlideShell from "@/layouts/SlideShell";
import { LetterStagger, ClipWipeReveal, ScoreboardFlip } from "@/animations";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "home-team",
  title: "03 · Home Team Introductions",
  transition: "split-flap-reset",
  durationHint: 16,
  notes: "MC reads each name like a stadium announcer. Pause for cheers between rows.",
  accent: "mag",
};

const roster = [
  { num: "01", name: "COACH AZLAN", role: "PE · SPRINT LEGEND" },
  { num: "02", name: "MADAM SITI", role: "CHEMISTRY · PLAYMAKER" },
  { num: "03", name: "MR. DAVID", role: "MATHS · FULL-STACK" },
  { num: "04", name: "CIKGU NURUL", role: "TIMETABLE · GOALKEEPER" },
  { num: "05", name: "SIR FARID", role: "PHYSICS · STRIKER" },
  { num: "06", name: "MRS. LIM", role: "ENGLISH · CAPTAIN" },
  { num: "07", name: "COACH RAJ", role: "HISTORY · DEFENDER" },
  { num: "08", name: "MISS TAN", role: "ART · WINGER" },
];

export default function HomeTeam() {
  return (
    <SlideShell>
      {/* dot-matrix header strip */}
      <div className="bg-dots absolute inset-x-0 top-0 z-0 h-40 opacity-60" />

      <div className="absolute inset-x-0 top-12 z-10 flex items-center justify-between px-16">
        <ClipWipeReveal>
          <span className="bg-mag px-5 py-2 font-body text-[22px] font-bold tracking-[0.4em] text-ice">
            STARTING LINEUP
          </span>
        </ClipWipeReveal>
        <span className="font-body text-[22px] font-medium tracking-[0.4em] text-ice/50">
          ANNOUNCED LIVE
        </span>
      </div>

      <div className="absolute left-16 top-[17%] z-10">
        <h2 className="font-display uppercase leading-[0.9] text-ice">
          <LetterStagger text="THE HOME TEAM:" delay={0.1} className="block text-[120px] text-ice/80" />
          <LetterStagger text="YOUR TEACHERS" delay={0.38} className="block text-[150px] text-volt" />
        </h2>
      </div>

      {/* roster grid */}
      <ScoreboardFlip
        className="absolute inset-x-16 bottom-24 z-10 grid grid-cols-4 gap-5"
        delay={0.75}
        stagger={0.085}
        items={roster.map((p) => ({
          key: p.num,
          node: (
            <div className="border-2 border-ice/12 bg-panel px-8 py-6">
              <div className="font-display text-[70px] leading-none text-volt">{p.num}</div>
              <div className="mt-3 font-display text-[40px] uppercase leading-none text-ice">
                {p.name}
              </div>
              <div className="mt-3 font-body text-[19px] font-medium tracking-[0.22em] text-ice/55">
                {p.role}
              </div>
            </div>
          ),
        }))}
      />
    </SlideShell>
  );
}
