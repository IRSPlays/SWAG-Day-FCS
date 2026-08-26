"use client";

/* 04 · TALENT BLOCK A — four performances, one stage.
    Concert lineup card introducing the first performance block. */

import { motion } from "motion/react";
import SlideShell, { CourtLines, LiveBug, TickerBand } from "@/layouts/SlideShell";
import { LetterStagger, ClipWipeReveal } from "@/animations";
import { useSlideContent } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "talent-block-a",
  title: "04 · Talent Block A",
  transition: "split-flap-reset",
  durationHint: 25,
  notes:
    "MC: 'That was just the warm-up! Shifting gears to Talent Block A — four incredible performances. Make some noise!' Run the lineup while acts set up.",
  accent: "vio",
};

export const content = {
  kicker: "TALENT BLOCK A · FOUR PERFORMANCES",
  titleTop: "TALENT",
  titleBottom: "BLOCK A",
  serif: "The stage is theirs. Bring the noise.",
  lineup: [
    { n: "01", song: "PULANG", artist: "INSOMNIACKS", accent: "#8f6bff" },
    { n: "02", song: "DITTO", artist: "NEWJEANS", accent: "#ff3da6" },
    { n: "03", song: "EVERLONG", artist: "FOO FIGHTERS", accent: "#23dcff" },
    { n: "04", song: "FLASHLIGHT", artist: "JESSIE J", accent: "#ffd23f" },
  ],
  ticker: [
    "TALENT BLOCK A",
    "FOUR ACTS ONE STAGE",
    "PULANG · DITTO · EVERLONG · FLASHLIGHT",
    "MAKE SOME NOISE",
    "SWAG DAY '26",
  ],
};

export default function TalentBlockA() {
  const c = useSlideContent(meta.id, content);

  return (
    <SlideShell className="bg-[#05030c]">
      <CourtLines />

      {/* top broadcast header */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between border-b-2 border-ice/10 bg-court/80 px-14 py-4 backdrop-blur-md">
        <div className="flex items-center gap-4 font-mono text-[16px] font-bold tracking-[0.35em] text-ice/80">
          <LiveBug label="LIVE STAGE" />
          <span>{c.kicker}</span>
        </div>
        <div className="font-mono text-[16px] font-bold tracking-[0.35em] text-volt">
          NOW LOADING
        </div>
      </div>

      {/* left: massive title */}
      <div className="absolute left-16 top-[19%] z-10 max-w-[980px]">
        <ClipWipeReveal delay={0.1}>
          <div className="inline-block -rotate-1 border-2 border-vio bg-vio/20 px-5 py-2 font-mono text-[15px] font-bold tracking-[0.4em] text-vio backdrop-blur-md">
            {c.kicker}
          </div>
        </ClipWipeReveal>

        <h1 className="mt-4 font-display uppercase leading-[0.82] tracking-tighter text-ice">
          <span className="block text-[165px]">
            <LetterStagger text={c.titleTop} delay={0.25} />
          </span>
          <span className="block -skew-x-6 text-[190px] text-vio">
            <LetterStagger text={c.titleBottom} delay={0.45} />
          </span>
        </h1>

        <ClipWipeReveal delay={0.7} from="left">
          <p className="mt-3 font-serifit text-[42px] italic text-ice/85">{c.serif}</p>
        </ClipWipeReveal>
      </div>

      {/* right: lineup slabs */}
      <div className="absolute inset-y-[130px] right-14 z-10 flex w-[640px] flex-col justify-center gap-5">
        {c.lineup.map((s, idx) => (
          <motion.div
            key={s.n}
            initial={{ x: 90, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.35 + idx * 0.18, duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex items-center gap-7 overflow-hidden border-l-8 bg-panel/90 px-8 py-5 shadow-2xl backdrop-blur-xl"
            style={{ borderColor: s.accent }}
          >
            <span
              className="font-display text-[76px] font-black leading-none"
              style={{ color: s.accent }}
            >
              {s.n}
            </span>
            <div className="min-w-0">
              <div className="font-display text-[52px] font-black uppercase leading-none tracking-tight text-ice">
                {s.song}
              </div>
              <div className="mt-1.5 font-mono text-[15px] font-bold tracking-[0.28em] text-ice/60">
                {s.artist}
              </div>
            </div>
            {/* spin disk */}
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 4 + idx, repeat: Infinity, ease: "linear" }}
              className="ml-auto h-12 w-12 shrink-0 rounded-full border-4 border-dashed"
              style={{ borderColor: `${s.accent}88` }}
            />
          </motion.div>
        ))}
      </div>

      {/* bottom ticker */}
      <div className="absolute inset-x-0 bottom-0 z-30">
        <TickerBand items={c.ticker} />
      </div>
    </SlideShell>
  );
}
