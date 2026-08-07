"use client";

/* 04 · THE GAMES — running order with jersey numerals. */

import SlideShell, { CourtLines } from "@/layouts/SlideShell";
import { LetterStagger, ClipWipeReveal, JerseyPop } from "@/animations";
import { at } from "@/motion/choreography";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "the-games",
  title: "04 · The Games",
  transition: "track-sweep",
  durationHint: 14,
  notes: "Run down each event with its demo crew in position.",
  accent: "mag",
};

const events = [
  { n: "01", name: "TEACHERS RELAY", time: "09:10", tag: "4 × 50M" },
  { n: "02", name: "TUG-OF-WAR", time: "09:40", tag: "HOUSE VS HOUSE" },
  { n: "03", name: "MUSICAL CHAIRS", time: "10:15", tag: "SUDDEN DEATH" },
  { n: "04", name: "DODGEBALL FINALE", time: "10:45", tag: "ALL IN" },
];

export default function TheGames() {
  const numDelay = at(0.35, 0.16);
  const nameDelay = at(0.45, 0.16);

  return (
    <SlideShell>
      <CourtLines />

      {/* diagonal rally ribbon */}
      <div className="absolute -left-44 top-[26%] z-0 h-36 w-[2600px] rotate-[-7deg] bg-mag" />

      <div className="absolute left-16 top-[10%] z-10">
        <ClipWipeReveal>
          <span className="font-body text-[26px] font-bold tracking-[0.42em] text-volt">
            RUNNING ORDER
          </span>
        </ClipWipeReveal>
        <h2 className="mt-4 font-display uppercase leading-none">
          <LetterStagger text="THE GAMES" delay={0.12} className="block text-[170px] text-ice" />
        </h2>
        <ClipWipeReveal delay={0.5} from="left">
          <p className="mt-3 font-serifit text-[44px] italic text-vio">
            four events. one champion. zero mercy.
          </p>
        </ClipWipeReveal>
      </div>

      {/* events list */}
      <div className="absolute inset-x-16 bottom-16 z-10 flex flex-col">
        {events.map((e, i) => (
          <div
            key={e.n}
            className="flex items-center gap-10 border-b-2 border-ice/10 py-5 last:border-b-0"
          >
            <JerseyPop delay={numDelay(i)} from={0.3} rotate={-8}>
              <span className="block w-[150px] font-display text-[104px] leading-none text-volt">
                {e.n}
              </span>
            </JerseyPop>
            <ClipWipeReveal delay={nameDelay(i)} from="left" className="flex-1">
              <span className="font-display text-[84px] uppercase leading-none text-ice">
                {e.name}
              </span>
            </ClipWipeReveal>
            <ClipWipeReveal delay={nameDelay(i) + 0.12} from="right">
              <div className="text-right">
                <div className="font-display text-[46px] leading-none text-vio">{e.time}</div>
                <div className="mt-1 font-body text-[20px] font-bold tracking-[0.3em] text-ice/50">
                  {e.tag}
                </div>
              </div>
            </ClipWipeReveal>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}
