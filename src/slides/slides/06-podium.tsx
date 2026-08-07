"use client";

/* 06 · TO THE PODIUM — awards moment, blocks rise from the floor. */

import SlideShell from "@/layouts/SlideShell";
import { LetterStagger, ClipWipeReveal, JerseyPop, RiseIn } from "@/animations";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "podium",
  title: "06 · Awards — Podium",
  transition: "whistle-cut",
  durationHint: 18,
  notes: "Fire the fanfare sting as the #1 block lands. Winners walk from the east tunnel.",
  accent: "volt",
};

const podium = [
  { place: "2", label: "MOST PATIENT HUMAN", height: 260, skin: "bg-ice/25 border-ice/70" },
  { place: "1", label: "TODAY'S MVP", height: 380, skin: "bg-volt border-volt" },
  { place: "3", label: "QUIETLY SAVAGE", height: 200, skin: "bg-vio/80 border-vio" },
];

export default function Podium() {
  return (
    <SlideShell>
      <div className="bg-dots absolute inset-x-0 top-0 z-0 h-44 opacity-50" />

      <div className="absolute left-16 top-[11%] z-10">
        <ClipWipeReveal>
          <span className="font-body text-[26px] font-bold tracking-[0.42em] text-volt">
            AWARDS CEREMONY
          </span>
        </ClipWipeReveal>
        <h2 className="mt-4 font-display uppercase leading-none">
          <LetterStagger text="TO THE PODIUM." delay={0.12} className="block text-[150px] text-ice" />
        </h2>
      </div>

      {/* MVP tag */}
      <JerseyPop delay={1.15} from={0.5} className="absolute left-1/2 top-[34%] z-20 -translate-x-1/2">
        <span className="block -rotate-2 bg-mag px-6 py-2 font-body text-[26px] font-bold tracking-[0.34em] text-ice">
          ★ CHAMPIONS OF THE CLASSROOM ★
        </span>
      </JerseyPop>

      {/* podium blocks */}
      <div className="absolute inset-x-0 bottom-0 z-10 overflow-hidden">
        <div className="mx-auto flex w-[1100px] items-end justify-center gap-8 pb-0">
          {podium.map((p, i) => (
            <RiseIn key={p.place} delay={0.5 + i * 0.18} className="w-[340px]">
              <div
                className={`flex flex-col items-center justify-start border-t-8 pt-8 ${p.skin}`}
                style={{ height: p.height }}
              >
                <span
                  className={`font-display leading-none ${
                    p.place === "1" ? "text-[150px] text-court" : "text-[110px] text-ice"
                  }`}
                >
                  {p.place}
                </span>
              </div>
              <div className="border-x-2 border-b-2 border-ice/15 bg-panel px-4 py-4 text-center">
                <span
                  className={`font-body text-[21px] font-bold tracking-[0.24em] ${
                    p.place === "1" ? "text-volt" : "text-ice/70"
                  }`}
                >
                  {p.label}
                </span>
              </div>
            </RiseIn>
          ))}
        </div>
      </div>
    </SlideShell>
  );
}
