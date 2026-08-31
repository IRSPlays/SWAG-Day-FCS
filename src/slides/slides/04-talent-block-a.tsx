"use client";

/* 04 · TALENT BLOCK A — four performances, one stage.
   Festival-bill layout: header strip up top, 4 equal poster cards
   marching across the lower deck. Distinct from side-panel slides. */

import { motion } from "motion/react";
import SlideShell, { LiveBug, TickerBand } from "@/layouts/SlideShell";
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
  kicker: "TALENT BLOCK A · FOUR PERFORMANCES ONE STAGE",
  titleTop: "TALENT",
  titleBottom: "BLOCK A",
  serif: "The stage is theirs.",
  lineup: [
    { n: "01", song: "PULANG", artist: "INSOMNIACKS", accent: "#e1811f", tag: "BAND" },
    { n: "02", song: "DITTO", artist: "NEWJEANS", accent: "#ea3a3a", tag: "DANCE" },
    { n: "03", song: "EVERLONG", artist: "FOO FIGHTERS", accent: "#4758d6", tag: "ROCK" },
    { n: "04", song: "FLASHLIGHT", artist: "JESSIE J", accent: "#eeeded", tag: "SOLO" },
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
    <SlideShell>
      {/* top header band — full-width title bar, nothing on the sides */}
      <div className="absolute inset-x-0 top-0 z-30 border-b-2 border-ice/10 bg-court/85 px-16 py-6 backdrop-blur-md">
        <div className="flex items-end justify-between">
          <div>
            <ClipWipeReveal delay={0.05}>
              <span className="font-mono text-[15px] font-bold tracking-[0.4em] text-vio">
                {c.kicker}
              </span>
            </ClipWipeReveal>
            <h1 className="mt-2 font-display uppercase leading-[0.82] tracking-tighter">
              <LetterStagger text={c.titleTop} delay={0.2} className="block text-[104px] text-ice" />
              <LetterStagger
                text={c.titleBottom}
                delay={0.42}
                className="block skew-x-[-5deg] text-[130px] text-vio"
              />
            </h1>
          </div>
          <ClipWipeReveal delay={0.65}>
            <p className="pb-4 font-serifit text-[36px] italic text-ice/70">{c.serif}</p>
          </ClipWipeReveal>
        </div>
      </div>

      {/* 4-poster festival bill across the lower deck */}
      <div className="absolute inset-x-10 bottom-24 top-[400px] z-10 grid grid-cols-4 gap-6">
        {c.lineup.map((s, idx) => (
          <motion.div
            key={s.n}
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 + idx * 0.16, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex flex-col overflow-hidden border-t-8 bg-panel/90 p-7 shadow-2xl backdrop-blur-xl transition-transform duration-500 hover:-translate-y-2"
            style={{ borderTopColor: s.accent }}
          >
            {/* watermark act number */}
            <span
              className="pointer-events-none absolute -bottom-12 -right-4 select-none font-display text-[240px] font-black leading-none opacity-[0.07]"
              style={{ color: s.accent }}
            >
              {s.n}
            </span>

            <span
              className="inline-block w-fit border px-3 py-1 font-mono text-[12px] font-bold tracking-[0.35em]"
              style={{ borderColor: s.accent, color: s.accent }}
            >
              ACT {s.n} · {s.tag}
            </span>

            <h3 className="mt-auto font-display text-[58px] font-black uppercase leading-[0.9] tracking-tight text-ice">
              {s.song}
            </h3>
            <p className="mt-3 font-mono text-[16px] font-bold tracking-[0.25em] text-ice/60">
              {s.artist}
            </p>

            {/* spinning vinyl footer */}
            <div className="mt-6 flex items-center gap-3">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 3.5 + idx * 0.7, repeat: Infinity, ease: "linear" }}
                className="h-9 w-9 shrink-0 rounded-full border-4 border-dashed"
                style={{ borderColor: `${s.accent}99` }}
              />
              <span className="h-px flex-1" style={{ background: `${s.accent}44` }} />
            </div>
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
