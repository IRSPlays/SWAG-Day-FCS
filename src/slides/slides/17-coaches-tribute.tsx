"use client";

/* 17 · COACHES & TEACHERS TRIBUTE — The Emotional Peak.
   High-fashion stadium concert editorial tribute with 110px Instrument Serif italic poetry.
   Automatically starts playing "September" (Earth, Wind & Fire) and auto-transitions
   to the End Credits slide after 20 seconds. */

import { useEffect } from "react";
import { motion } from "motion/react";
import SlideShell, { CourtLines } from "@/layouts/SlideShell";
import { LetterStagger, ClipWipeReveal } from "@/animations";
import { useSlideContent, useShow } from "@/store/show";
import OutroBgmPlayer from "@/components/OutroBgmPlayer";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "coaches-tribute",
  title: "17 · Coaches & Teachers Tribute",
  transition: "slow-fade-black",
  durationHint: 20,
  notes:
    "EMOTIONAL PEAK — 'September' starts playing automatically. Auto-transitions to End Credits after 20 seconds.",
  accent: "vio",
};

export const content = {
  kicker: "A TRIBUTE TO OUR MENTORS",
  quote: "For the ones who stay late, cheer loudest, and believe in us first.",
  subquote: "Every practice, every match, every lesson in life.",
  salute: "THANK YOU FOR COACHING US",
  school: "SWAG DAY '26 · TEACHERS' DAY PRODUCTION",
};

export default function CoachesTribute() {
  const c = useSlideContent(meta.id, content);
  const dispatch = useShow((s) => s.dispatch);

  /* auto transition to Slide 18 (End Credits) after 20 seconds */
  useEffect(() => {
    const timer = setTimeout(() => {
      const curIndex = useShow.getState().index;
      dispatch({ type: "cue", index: curIndex + 1, dir: 1 });
    }, 20000);
    return () => clearTimeout(timer);
  }, [dispatch]);

  return (
    <SlideShell className="bg-[#040209]">
      <CourtLines />

      {/* giant background watermark lettering */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none">
        <span className="font-display text-[420px] font-black uppercase leading-none tracking-tighter text-white/[0.02]">
          TRIBUTE
        </span>
      </div>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-24 text-center">
        {/* top kicker */}
        <ClipWipeReveal delay={0.2} from="top">
          <div className="inline-block border-2 border-volt bg-volt/15 px-6 py-2 font-mono text-[15px] font-bold tracking-[0.45em] text-volt">
            {c.kicker}
          </div>
        </ClipWipeReveal>

        {/* main tribute headline in massive instrument serif */}
        <h2 className="mt-12 max-w-[1600px] font-serifit text-[104px] italic leading-[1.08] text-ice">
          <LetterStagger
            text={c.quote}
            delay={0.5}
            stagger={0.02}
            duration={0.85}
            from="0.3em"
            skewX={0}
          />
        </h2>

        {/* subquote */}
        <ClipWipeReveal delay={1.8} from="bottom">
          <p className="mt-8 font-mono text-[22px] font-semibold tracking-[0.3em] text-ice/60">
            {c.subquote}
          </p>
        </ClipWipeReveal>

        {/* big salute footer */}
        <div className="mt-14 flex flex-col items-center gap-3">
          <ClipWipeReveal delay={2.3} from="bottom">
            <h3 className="font-display text-[54px] font-black uppercase tracking-[0.25em] text-volt">
              {c.salute}
            </h3>
          </ClipWipeReveal>

          <ClipWipeReveal delay={2.6} from="bottom">
            <p className="font-mono text-[14px] font-bold tracking-[0.4em] text-ice/40">
              {c.school}
            </p>
          </ClipWipeReveal>
        </div>
      </div>

      {/* bottom-left "September" BGM Player */}
      <OutroBgmPlayer
        className="absolute bottom-8 left-8 z-30"
        defaultSrc="/audio/september.flac"
        autoPlay={true}
      />

      {/* 20-second subtle auto-advance indicator line across bottom */}
      <div className="absolute inset-x-0 bottom-0 z-30 h-1 bg-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 20, ease: "linear" }}
          className="h-full bg-volt"
        />
      </div>
    </SlideShell>
  );
}
