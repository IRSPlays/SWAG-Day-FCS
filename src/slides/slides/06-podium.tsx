"use client";

/* 06 · TO THE PODIUM — awards moment, blocks rise from the floor. */

import SlideShell from "@/layouts/SlideShell";
import { LetterStagger, ClipWipeReveal, JerseyPop, RiseIn } from "@/animations";
import { useSlideContent } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "podium",
  title: "06 · Awards — Podium",
  transition: "whistle-cut",
  durationHint: 18,
  notes: "Fire the sting as the #1 block lands. Winners walk from the east tunnel.",
  accent: "volt",
};

export const content = {
  kicker: "AWARDS CEREMONY",
  title: "TO THE PODIUM.",
  tag: "★ CHAMPIONS OF THE CLASSROOM ★",
  podium: [
    { place: "2", label: "MOST PATIENT HUMAN" },
    { place: "1", label: "TODAY'S MVP" },
    { place: "3", label: "QUIETLY SAVAGE" },
  ],
};

const SKINS: Record<string, { h: number; cls: string; num: string; lbl: string }> = {
  "2": { h: 260, cls: "bg-ice/25 border-ice/70", num: "text-[110px] text-ice", lbl: "text-ice/70" },
  "1": { h: 380, cls: "bg-volt border-volt", num: "text-[150px] text-court", lbl: "text-volt" },
  "3": { h: 200, cls: "bg-vio/70 border-vio", num: "text-[110px] text-ice", lbl: "text-ice/70" },
};

export default function Podium() {
  const c = useSlideContent(meta.id, content);
  return (
    <SlideShell>
      <div className="bg-dots absolute inset-x-0 top-0 z-0 h-44 opacity-50" />

      <div className="absolute left-16 top-[11%] z-10">
        <ClipWipeReveal>
          <span className="font-body text-[26px] font-bold tracking-[0.42em] text-volt">
            {c.kicker}
          </span>
        </ClipWipeReveal>
        <h2 className="mt-4 font-display uppercase leading-none">
          <LetterStagger text={c.title} delay={0.12} className="block text-[150px] text-ice" />
        </h2>
      </div>

      <JerseyPop delay={1.15} from={0.5} className="absolute left-1/2 top-[34%] z-20 -translate-x-1/2">
        <span className="block -rotate-2 bg-mag px-6 py-2 font-body text-[26px] font-bold tracking-[0.34em] text-ice">
          {c.tag}
        </span>
      </JerseyPop>

      <div className="absolute inset-x-0 bottom-0 z-10 overflow-hidden">
        <div className="mx-auto flex w-[1100px] items-end justify-center gap-8">
          {c.podium.map((p, i) => {
            const skin = SKINS[p.place] ?? SKINS["3"];
            return (
              <RiseIn key={p.place} delay={0.5 + i * 0.18} className="w-[340px]">
                <div
                  className={`flex flex-col items-center justify-start border-t-8 pt-8 ${skin.cls}`}
                  style={{ height: skin.h }}
                >
                  <span className={`font-display leading-none ${skin.num}`}>{p.place}</span>
                </div>
                <div className="border-x-2 border-b-2 border-ice/15 bg-panel px-4 py-4 text-center">
                  <span className={`font-body text-[21px] font-bold tracking-[0.24em] ${skin.lbl}`}>
                    {p.label}
                  </span>
                </div>
              </RiseIn>
            );
          })}
        </div>
      </div>
    </SlideShell>
  );
}