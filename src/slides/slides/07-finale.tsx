"use client";

/* 07 · FINALE — everything goes quiet. One line, one feeling. */

import SlideShell from "@/layouts/SlideShell";
import { LetterStagger, ClipWipeReveal, KenBurns } from "@/animations";
import { useSlideContent } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "finale",
  title: "07 · Finale",
  transition: "slow-fade-black",
  durationHint: 25,
  notes: "Drop all music. Let the room read. Trigger the survey from the controller after ~20s.",
  accent: "vio",
};

export const content = {
  kicker: "FINAL WHISTLE",
  line: "“Thank you for coaching us in life.”",
  footer1: "HAPPY TEACHERS' DAY — FROM ALL OF US",
  footer2: "SWAG DAY '26 · SUIT UP! SHOW UP! SPORT IT UP!",
};

export default function Finale() {
  const c = useSlideContent(meta.id, content);
  return (
    <SlideShell className="bg-[#070512]">
      <KenBurns
        className="absolute left-1/2 top-1/2 z-0 h-[900px] w-[1400px] -translate-x-1/2 -translate-y-1/2"
        duration={24}
        scale={1.25}
      >
        <div className="h-full w-full rounded-full bg-volt/[0.07] blur-[120px]" />
      </KenBurns>

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-24 text-center">
        <p className="font-body text-[24px] font-bold tracking-[0.5em] text-ice/40">{c.kicker}</p>

        <h2 className="mt-10 max-w-[1500px] font-serifit text-[110px] italic leading-[1.12] text-ice">
          <LetterStagger text={c.line} delay={0.4} stagger={0.03} duration={0.9} from="0.4em" skewX={0} />
        </h2>

        <ClipWipeReveal delay={2.1} from="bottom">
          <p className="mt-12 font-body text-[26px] font-bold tracking-[0.44em] text-volt">{c.footer1}</p>
        </ClipWipeReveal>
        <ClipWipeReveal delay={2.5} from="bottom">
          <p className="mt-3 font-body text-[20px] font-medium tracking-[0.4em] text-ice/40">{c.footer2}</p>
        </ClipWipeReveal>
      </div>
    </SlideShell>
  );
}