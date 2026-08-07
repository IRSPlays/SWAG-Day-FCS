"use client";

/* 05 · LIVE VOTE — the audience slide. Wired to /audience in build 07;
   option copy here is the editable source of truth. */

import SlideShell, { CourtLines } from "@/layouts/SlideShell";
import { LetterStagger, ClipWipeReveal, ScoreboardFlip } from "@/animations";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "live-vote",
  title: "05 · Live Vote — MVP",
  transition: "baton-change",
  durationHint: 20,
  notes: "Open voting from the controller. Results reveal on stage when voting closes.",
  accent: "volt",
};

const options = [
  { key: "A", name: "COACH AZLAN", sub: "THE SPRINT LEGEND" },
  { key: "B", name: "MRS. LIM", sub: "THE CAPTAIN" },
  { key: "C", name: "MR. DAVID", sub: "FULL-STACK MATHS" },
];

export default function LiveVote() {
  return (
    <SlideShell>
      <CourtLines />

      {/* left: pitch */}
      <div className="absolute left-16 top-[14%] z-10 max-w-[820px]">
        <ClipWipeReveal>
          <span className="inline-block -rotate-1 bg-mag px-5 py-2 font-body text-[24px] font-bold tracking-[0.4em] text-ice">
            LIVE VOTE
          </span>
        </ClipWipeReveal>

        <h2 className="mt-8 font-display uppercase leading-[0.88]">
          <LetterStagger text="FANS" delay={0.12} className="block text-[168px] text-ice" />
          <LetterStagger text="DECIDE." delay={0.34} className="block text-[168px] text-volt" />
        </h2>

        <ClipWipeReveal delay={0.8} from="left">
          <p className="mt-8 font-serifit text-[46px] italic leading-tight text-vio">
            scan the code. tap your MVP. crown them live.
          </p>
        </ClipWipeReveal>

        {/* QR placeholder — real QR renders here in build 07 */}
        <ClipWipeReveal delay={1.05}>
          <div className="mt-10 flex h-[220px] w-[220px] flex-col items-center justify-center gap-2 border-4 border-dashed border-ice/30">
            <span className="font-display text-[44px] leading-none text-ice/70">QR</span>
            <span className="px-4 text-center font-body text-[16px] font-bold tracking-[0.18em] text-ice/45">
              AUDIENCE CODE — LIVE IN BUILD 07
            </span>
          </div>
        </ClipWipeReveal>
        <p className="mt-4 font-body text-[20px] font-bold tracking-[0.3em] text-ice/40">
          ONE PHONE · ONE VOTE
        </p>
      </div>

      {/* right: ballot board */}
      <div className="absolute right-16 top-1/2 z-10 w-[860px] -translate-y-1/2">
        <div className="mb-5 flex items-center justify-between">
          <span className="font-body text-[22px] font-bold tracking-[0.4em] text-ice/50">
            TODAY&apos;S MVP
          </span>
          <span className="font-body text-[22px] font-bold tracking-[0.4em] text-volt">
            TAP ON YOUR PHONE
          </span>
        </div>
        <ScoreboardFlip
          delay={0.55}
          stagger={0.14}
          items={options.map((o) => ({
            key: o.key,
            node: (
              <div className="mb-5 flex items-center gap-8 border-2 border-ice/12 bg-panel px-8 py-7">
                <span className="grid h-[84px] w-[84px] place-items-center bg-volt font-display text-[52px] text-court">
                  {o.key}
                </span>
                <div>
                  <div className="font-display text-[56px] uppercase leading-none text-ice">
                    {o.name}
                  </div>
                  <div className="mt-2 font-body text-[21px] font-medium tracking-[0.26em] text-ice/50">
                    {o.sub}
                  </div>
                </div>
              </div>
            ),
          }))}
        />
        <p className="font-body text-[19px] font-bold tracking-[0.24em] text-ice/40">
          RESULTS REVEAL ON STAGE WHEN VOTING CLOSES
        </p>
      </div>
    </SlideShell>
  );
}
