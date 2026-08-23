"use client";

/* 16 · SURPRISE PSG DANCE — Parent Support Group Special Performance.
   High-energy retro-funk concert visual for "I Want You Back" & "Beat It". */

import { motion } from "motion/react";
import SlideShell, { CourtLines, LiveBug, TickerBand } from "@/layouts/SlideShell";
import { LetterStagger, ClipWipeReveal } from "@/animations";
import { useSlideContent, useShow } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "psg-dance",
  title: "16 · Surprise PSG Dance",
  transition: "baton-change",
  durationHint: 240,
  notes:
    "PSG EXPLOSION! Parents storm the stage. Dance tracks: I Want You Back + Beat It. Switch floor camera to Fullscreen / PIP for dance action!",
  accent: "mag",
};

export const content = {
  kicker: "SURPRISE SPECIAL GUEST DANCE",
  titleTop: "PSG DANCE",
  titleBottom: "EXPLOSION",
  serif: "Special tribute performance by the Parent Support Group.",
  performers: "PARENT SUPPORT GROUP DANCE CREW",
  songs: [
    { title: "I WANT YOU BACK", artist: "THE JACKSON 5", badge: "RETRO FUNK", color: "#ff3da6" },
    { title: "BEAT IT", artist: "MICHAEL JACKSON", badge: "POP ROCK", color: "#23dcff" },
  ],
  ticker: [
    "SURPRISE PSG DANCE",
    "GIVE IT UP FOR THE PARENTS",
    "ON YOUR FEET",
    "I WANT YOU BACK",
    "BEAT IT",
    "SWAG DAY '26",
  ],
};

export default function PsgDance() {
  const c = useSlideContent(meta.id, content);
  const cameraOn = useShow((s) => s.cameraOn);
  const activeCam = useShow((s) => s.activeCam);

  return (
    <SlideShell className="bg-[#08020d]">
      <CourtLines />

      {/* top broadcast header */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between border-b-2 border-ice/10 bg-court/80 px-14 py-4 backdrop-blur-md">
        <div className="flex items-center gap-4 font-mono text-[16px] font-bold tracking-[0.35em] text-ice/80">
          <LiveBug label="SURPRISE PERFORMANCE" />
          <span>{c.kicker}</span>
        </div>
        <div className="font-mono text-[16px] font-bold tracking-[0.35em] text-volt">
          {cameraOn ? `DANCE CAM: ${activeCam ?? "CAM 1"}` : "PSG ON STAGE"}
        </div>
      </div>

      {/* main dance visual split */}
      <div className="relative z-10 flex h-full items-center justify-between px-16 pb-20 pt-16">
        {/* left column: big typography */}
        <div className="max-w-[880px]">
          <ClipWipeReveal delay={0.1}>
            <div className="inline-block border-2 border-mag bg-mag/15 px-5 py-1.5 font-mono text-[14px] font-bold tracking-[0.4em] text-mag">
              PARENT SUPPORT GROUP
            </div>
          </ClipWipeReveal>

          <h1 className="mt-4 font-display uppercase leading-[0.82] tracking-tighter text-ice">
            <span className="block text-[150px]">
              <LetterStagger text={c.titleTop} delay={0.2} />
            </span>
            <span className="block -skew-x-6 text-[180px] text-mag">
              <LetterStagger text={c.titleBottom} delay={0.45} />
            </span>
          </h1>

          <ClipWipeReveal delay={0.7} from="left">
            <p className="mt-4 font-serifit text-[38px] italic text-ice/85">
              {c.serif}
            </p>
          </ClipWipeReveal>

          <div className="mt-8 inline-block border-l-8 border-volt bg-panel/90 px-6 py-3 backdrop-blur-md">
            <div className="font-mono text-[13px] font-bold tracking-[0.3em] text-volt">
              SPECIAL GUEST CREW
            </div>
            <div className="mt-1 font-display text-[26px] font-bold uppercase tracking-wider text-ice">
              {c.performers}
            </div>
          </div>
        </div>

        {/* right column: 2 massive high-contrast track cards with animated audio bars */}
        <div className="flex w-[740px] flex-col gap-6">
          {c.songs.map((s, idx) => (
            <motion.div
              key={s.title}
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.35 + idx * 0.2, duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-hidden border-4 bg-panel/95 p-8 shadow-2xl backdrop-blur-xl"
              style={{ borderColor: s.color }}
            >
              {/* top badge */}
              <div className="flex items-center justify-between">
                <span
                  className="inline-block border-2 px-3 py-1 font-mono text-[12px] font-bold tracking-[0.3em]"
                  style={{ borderColor: s.color, color: s.color }}
                >
                  {s.badge}
                </span>
                <span className="font-mono text-[14px] font-bold tracking-[0.3em] text-ice/40">
                  TRACK #{idx + 1}
                </span>
              </div>

              {/* song title */}
              <h3 className="mt-3 font-display text-[64px] font-black uppercase leading-none tracking-tight text-ice">
                {s.title}
              </h3>
              <p
                className="mt-2 font-mono text-[18px] font-bold tracking-[0.25em]"
                style={{ color: s.color }}
              >
                {s.artist}
              </p>

              {/* animated audio equalizer bars */}
              <div className="mt-6 flex items-end gap-1.5 h-8">
                {Array.from({ length: 32 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: ["20%", "95%", "35%", "80%", "15%"],
                    }}
                    transition={{
                      duration: 0.6 + (i % 5) * 0.15,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: (i % 7) * 0.08,
                    }}
                    className="w-full rounded-sm"
                    style={{ background: s.color }}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* bottom ticker */}
      <div className="absolute inset-x-0 bottom-0 z-30">
        <TickerBand items={c.ticker} />
      </div>
    </SlideShell>
  );
}
