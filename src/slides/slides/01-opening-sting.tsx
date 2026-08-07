"use client";

/* 01 · OPENING STING — the first thing the hall sees. */

import SlideShell, { CourtLines, LiveBug, TickerBand } from "@/layouts/SlideShell";
import { LetterStagger, ClipWipeReveal, JerseyPop } from "@/animations";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "opening-sting",
  title: "01 · Opening Sting",
  transition: "track-sweep",
  durationHint: 8,
  notes: "House music at 70%. Fire the whistle SFX the moment the title lands.",
  accent: "volt",
};

export default function OpeningSting() {
  return (
    <SlideShell>
      <CourtLines />

      {/* top status bar */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b-2 border-ice/10 px-14 py-5">
        <div className="flex items-center gap-4 font-body text-[22px] font-medium tracking-[0.4em] text-ice/80">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mag opacity-70" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-mag" />
          </span>
          LIVE FROM THE COURTS
        </div>
        <div className="font-body text-[22px] font-medium tracking-[0.4em] text-ice/80">
          SWAG DAY PRESENTS
        </div>
      </div>

      {/* giant bleeding numeral */}
      <JerseyPop delay={0.55} className="absolute -right-16 top-1/2 z-0 -translate-y-1/2">
        <span className="text-outline-ice block rotate-[-5deg] font-display text-[780px] leading-[0.8] text-transparent">
          26
        </span>
      </JerseyPop>

      {/* main block */}
      <div className="absolute left-16 top-[23%] z-10">
        <ClipWipeReveal delay={0.12}>
          <div className="inline-block -rotate-1 bg-mag px-6 py-2.5 font-body text-[26px] font-bold tracking-[0.32em] text-court">
            SUIT UP! SHOW UP! SPORT IT UP!
          </div>
        </ClipWipeReveal>

        <h1 className="mt-10 font-display uppercase leading-[0.86] text-ice">
          <LetterStagger text="TEACHERS'" delay={0.32} className="block text-[238px]" />
          <span className="block text-[238px]">
            <LetterStagger text="DAY" delay={0.66} />
            <LetterStagger text=" '26" delay={0.84} className="text-volt" />
          </span>
        </h1>

        <ClipWipeReveal delay={1.25} from="left">
          <p className="mt-10 font-serifit text-[56px] italic leading-tight text-vio">
            for the ones who coach us every single day.
          </p>
        </ClipWipeReveal>
      </div>

      {/* live bug */}
      <div className="absolute right-14 top-24 z-10">
        <LiveBug />
      </div>

      {/* bottom ticker */}
      <div className="absolute inset-x-0 bottom-0 z-10">
        <TickerBand
          items={[
            "SUIT UP! SHOW UP! SPORT IT UP!",
            "SWAG DAY '26",
            "CHEER LOUD — IT'S MANDATORY",
            "NO WHISTLES BEFORE 9AM",
            "HYDRATE OR SPECTATE",
          ]}
        />
      </div>
    </SlideShell>
  );
}
