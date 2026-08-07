"use client";

/* 02 · WELCOME & HOUSEKEEPING — ticket-stub layout. */

import SlideShell, { CourtLines } from "@/layouts/SlideShell";
import { LetterStagger, ClipWipeReveal, JerseyPop } from "@/animations";
import { at } from "@/motion/choreography";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "welcome",
  title: "02 · Welcome & Housekeeping",
  transition: "baton-change",
  durationHint: 14,
  notes: "MC welcomes the hall. Keep this up while staff find their seats.",
  accent: "vio",
};

const rows = [
  { n: "01", text: "ATHLETES (THAT'S THE STUDENTS) TAKE THE COURT AT 8:45" },
  { n: "02", text: "HYDRATION STATION BY THE BENCHES — TEACHERS FIRST" },
  { n: "03", text: "CHEER SQUADS TO THE EAST STAND. BRING THE NOISE." },
];

export default function Welcome() {
  const rowDelay = at(0.6, 0.18);
  return (
    <SlideShell>
      <CourtLines />

      {/* left column */}
      <div className="absolute left-16 top-[16%] z-10 max-w-[1120px]">
        <ClipWipeReveal>
          <span className="font-body text-[26px] font-bold tracking-[0.42em] text-volt">
            BEFORE THE WHISTLE
          </span>
        </ClipWipeReveal>

        <h2 className="mt-6 font-display uppercase leading-[0.9] text-ice">
          <LetterStagger text="WELCOME TO" delay={0.15} className="block text-[148px]" />
          <LetterStagger text="THE RALLY" delay={0.42} className="block text-[148px] text-volt" />
        </h2>

        <div className="mt-14 flex flex-col gap-7">
          {rows.map((r, i) => (
            <ClipWipeReveal key={r.n} delay={rowDelay(i)} from="left">
              <div className="flex items-baseline gap-7">
                <span className="font-display text-[46px] leading-none text-mag">{r.n}</span>
                <span className="font-body text-[33px] font-medium tracking-[0.08em] text-ice/90">
                  {r.text}
                </span>
              </div>
            </ClipWipeReveal>
          ))}
        </div>
      </div>

      {/* ticket stub */}
      <JerseyPop delay={0.5} rotate={5} className="absolute right-24 top-1/2 z-10 -translate-y-1/2">
        <div className="relative w-[560px] rotate-[-4deg] bg-ice text-court shadow-[18px_18px_0_rgba(0,0,0,0.35)]">
          <span className="absolute -left-6 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full bg-court" />
          <span className="absolute -right-6 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full bg-court" />

          <div className="border-b-4 border-dashed border-court/70 px-10 py-6">
            <div className="font-body text-[20px] font-bold tracking-[0.38em]">
              SWAG DAY &apos;26 · COURTSIDE
            </div>
          </div>

          <div className="px-10 py-8">
            <div className="font-display text-[88px] uppercase leading-[0.9]">
              Admit
              <br />
              One
            </div>
            <div className="mt-5 font-serifit text-[30px] italic text-court/80">
              all teachers. every event. no exceptions.
            </div>
          </div>

          <div className="barcode mx-10 mb-9 h-14 text-court/80" />
        </div>
      </JerseyPop>
    </SlideShell>
  );
}
