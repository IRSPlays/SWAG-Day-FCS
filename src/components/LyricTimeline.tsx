"use client";

/* LyricTimeline — the performance engine. A rAF clock starts the moment
   the slide mounts, hunts the current cue by timestamp and hands it to the
   right mograph treatment per section. Bands drift, so tap-along wins:
   ArrowDown = next line · ArrowUp = prev line · R = re-sync to the clock. */

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, type TargetAndTransition } from "motion/react";
import { EASE_GLIDE } from "@/motion/choreography";
import type { LyricCue, SongHeader } from "@/slides/lyrics";
import { LiveBug } from "@/layouts/SlideShell";
import LyricBackdrop from "@/components/LyricBackdrop";
import WordPunch from "@/animations/lyrics/WordPunch";
import SoftRise from "@/animations/lyrics/SoftRise";
import SpotlightSerif from "@/animations/lyrics/SpotlightSerif";

type Accent = "volt" | "mag" | "vio";

const ACCENT_TEXT: Record<Accent, string> = { volt: "text-volt", mag: "text-mag", vio: "text-vio" };
const ACCENT_FILL: Record<Accent, string> = { volt: "bg-volt", mag: "bg-mag", vio: "bg-vio" };
const ACCENT_EDGE: Record<Accent, string> = {
  volt: "border-volt text-volt",
  mag: "border-mag text-mag",
  vio: "border-vio text-vio",
};

/* one mograph voice per section — content-agnostic, pure motion */
function CueLine({ cue, accent }: { cue: LyricCue; accent: Accent }) {
  const hot = ACCENT_TEXT[accent];
  switch (cue.style) {
    case "hook":
      return (
        <WordPunch
          text={cue.text}
          accent={hot}
          className="font-display uppercase leading-[0.9] text-[210px] text-ice"
          stagger={0.12}
        />
      );
    case "chorus":
      return (
        <WordPunch
          text={cue.text}
          emph={cue.emph}
          accent={hot}
          className="font-display uppercase leading-[1.04] text-[118px] text-ice"
        />
      );
    case "pre":
      return (
        <WordPunch
          text={cue.text}
          emph={cue.emph}
          accent={hot}
          className="font-display uppercase leading-[1.08] text-[84px] text-ice/95"
          stagger={0.06}
        />
      );
    case "verse":
      return (
        <SoftRise className="font-body text-[72px] font-medium leading-snug tracking-tight text-ice/90">
          {cue.text}
        </SoftRise>
      );
    case "bridge":
      return (
        <SpotlightSerif
          text={cue.text}
          className="font-serifit text-[90px] italic leading-tight text-vio"
        />
      );
    case "outro":
      return (
        <SoftRise slow className="font-serifit text-[130px] italic leading-tight text-ice/85">
          {cue.text}
        </SoftRise>
      );
  }
}

/* how each section LEAVES — the exit is half the choreography */
const EXIT: Record<LyricCue["style"], TargetAndTransition> = {
  hook: { y: -80, opacity: 0, scale: 0.93, filter: "blur(8px)" },
  chorus: { y: -80, opacity: 0, scale: 0.93, filter: "blur(8px)" },
  pre: { y: -50, opacity: 0 },
  verse: { y: -36, opacity: 0, filter: "blur(6px)" },
  bridge: { opacity: 0, y: -20 },
  outro: { opacity: 0 },
};

export interface LyricTimelineProps {
  cues: LyricCue[];
  header: SongHeader;
  bpm?: number;
  accent?: Accent;
}

export default function LyricTimeline({
  cues,
  header,
  bpm = 82,
  accent = "vio",
}: LyricTimelineProps) {
  const [elapsed, setElapsed] = useState(0);
  const [manual, setManual] = useState<number | null>(null);
  const start = useRef<number | null>(null);

  /* rAF clock — starts on slide mount, drifts never (humans do) */
  useEffect(() => {
    let raf = 0;
    const tick = (now: number) => {
      if (start.current === null) start.current = now;
      setElapsed((now - start.current) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const clockIdx = useMemo(() => {
    let i = 0;
    for (let k = 0; k < cues.length; k++) if (cues[k].t <= elapsed) i = k;
    return i;
  }, [cues, elapsed]);

  const idx = manual ?? clockIdx;
  const cue = cues[idx];
  const next = cues[idx + 1];

  /* tap-along — only ↓ ↑ R; slide navigation keys stay untouched */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "ArrowDown") {
        e.preventDefault();
        setManual(Math.min(cues.length - 1, idx + 1));
      } else if (e.code === "ArrowUp") {
        e.preventDefault();
        setManual(Math.max(0, idx - 1));
      } else if (e.code === "KeyR") {
        setManual(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, cues.length]);

  const energy =
    cue && (cue.style === "chorus" || cue.style === "hook") ? 1 : cue?.style === "bridge" ? 0.3 : 0.6;

  return (
    <div className="relative h-full w-full overflow-hidden bg-court">
      <LyricBackdrop bpm={bpm} energy={energy} accent={accent} />

      {/* broadcast header */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b-2 border-ice/10 px-14 py-5">
        <div className="flex items-center gap-6">
          <span
            className={`border-2 px-4 py-1.5 font-body text-[20px] font-bold tracking-[0.32em] ${ACCENT_EDGE[accent]}`}
          >
            {header.kind}
          </span>
          <span className="font-display text-[30px] uppercase tracking-wide text-ice">
            {header.song} <span className="text-ice/40">·</span>{" "}
            <span className="text-ice/70">{header.artist}</span>
          </span>
        </div>
        <LiveBug label="ON STAGE" />
      </div>

      {/* the lyric */}
      <div className="absolute inset-0 z-10 flex items-center justify-center px-40 pb-28 text-center">
        <AnimatePresence mode="wait">
          {cue && (
            <motion.div
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={EXIT[cue.style]}
              transition={{ duration: 0.55, ease: [0.55, 0, 1, 0.45] }}
            >
              <CueLine cue={cue} accent={accent} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* section badge */}
      <div className="absolute left-14 top-28 z-10">
        <AnimatePresence mode="wait">
          {cue?.label && (
            <motion.span
              key={cue.label}
              className={`inline-block border-2 bg-court/60 px-4 py-1.5 font-body text-[18px] font-bold tracking-[0.4em] ${ACCENT_EDGE[accent]}`}
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -14, opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE_GLIDE }}
            >
              {cue.label}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* next-line ghost + manual flag + progress ticks */}
      <div className="absolute inset-x-0 bottom-14 z-10 flex flex-col items-center gap-5">
        {next && (
          <p className="font-body text-[26px] tracking-[0.14em] text-ice/35">
            <span className={`mr-3 font-bold ${ACCENT_TEXT[accent]}`}>NEXT ▸</span>
            {next.text}
          </p>
        )}
        <div className="flex w-[760px] max-w-[72%] items-center gap-3">
          {cues.map((_, i) => (
            <motion.div
              key={i}
              className={`h-[7px] flex-1 ${i <= idx ? ACCENT_FILL[accent] : "bg-ice/15"}`}
              animate={i === idx ? { opacity: [1, 0.35, 1] } : { opacity: 1 }}
              transition={i === idx ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : {}}
            />
          ))}
          {manual !== null && (
            <span className="ml-2 font-body text-[17px] font-bold tracking-[0.3em] text-mag">
              MANUAL · R TO RE-SYNC
            </span>
          )}
        </div>
      </div>

      {/* broadcast finish */}
      <div className="vignette pointer-events-none absolute inset-0 z-0" />
      <div className="bg-noise pointer-events-none absolute inset-0 z-20 opacity-[0.06] mix-blend-overlay" />
    </div>
  );
}
