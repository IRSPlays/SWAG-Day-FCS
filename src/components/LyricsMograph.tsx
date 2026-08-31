"use client";

/* LyricsMograph - the FULL MOGRAPH lyric experience.
   Replaces the am-lyrics stack with a bespoke kinetic-typography stage:
   - full-bleed blurred cover backdrop with a slow cinematic drift
   - aurora accent light that breathes with the song's BPM
   - giant word-by-word typography: every word pops in with a spring and
     LIGHTS UP exactly when it is sung (official TTML word timings)
   - section-driven treatments: CHORUS = giant Anton caps in accent,
     BRIDGE = italic serif intimacy, VERSE = clean grotesk
   - next-line ghost, section badge, progress rail, clock
   Drive: the audio track is the clock (audio prop) OR the /lyrics operator
   Stage keys still work: P play/pause, arrows next/prev, R restart. */

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { LyricCue, SongHeader } from "@/slides/lyrics";
import { LetterStagger } from "@/animations";
import { getTransport } from "@/realtime/transport";
import { useSlideAction, useMuted } from "@/engine/advance";
import { useShow } from "@/store/show";
import { cuesToLines, fmtClock, parseTtml, sectionAt, type LyricWord } from "@/lib/lyrics";

export interface PerformerCredit {
  role: string;
  names: string[];
}

export interface LyricsMographProps {
  cues: LyricCue[];
  header: SongHeader;
  bpm: number;
  accent?: "volt" | "mag" | "vio";
  cover?: string;
  lyricSize?: number;
  ttmlUrl?: string;
  audio?: string;
  sections?: { t: number; label: string }[];
  /** who is on stage - shown on the intro card + persistent credit line */
  credits?: PerformerCredit[];
  /** slide id - routes lyric-cmd / lyric-state for the operator console */
  slideId?: string;
}

const ACCENT_HEX: Record<string, string> = {
  volt: "#4758d6",
  mag: "#ea3a3a",
  vio: "#e1811f",
};

type Treat = "chorus" | "bridge" | "verse";

function treatFor(label: string): Treat {
  const l = (label || "").toUpperCase();
  if (l.includes("CHORUS") || l.includes("HOOK") || l.includes("LIFT") || l.includes("FINALE"))
    return "chorus";
  if (l.includes("BRIDGE")) return "bridge";
  return "verse";
}

/* typography per treatment — INLINE STYLES on purpose: guaranteed to apply
   no matter what the utility pipeline does, and sized for a 1080p stage.
   fitSize() shrinks long lines so they always fit the frame width. */
const TREAT_FONT: Record<Treat, { family: string; size: number; caps?: boolean; serif?: boolean }> = {
  chorus: { family: "var(--font-display)", size: 172, caps: true },
  bridge: { family: "var(--font-instrument)", size: 130, serif: true },
  verse: { family: "var(--font-body)", size: 118 },
};

/* keep the line inside ~86% of the 1920 frame: est. glyph ~0.5em wide */
function fitSize(base: number, text: string): number {
  return Math.min(base, Math.max(60, 3300 / Math.max(8, text.length)));
}

/* ADAPTIVE BACKGROUND - the stage lighting reacts to the song section:
   chorus/lift = the backdrop IGNITES (brighter, saturated, aurora flares,
   faster breathing); bridge = everything dims and slows (intimate);
   verse/intro = the default cinematic mood. */
interface Vibe {
  brightness: number;
  saturate: number;
  glow: number;      // aurora strength multiplier
  breath: number;    // aurora speed multiplier
  scrim: number;     // dark veil opacity over the backdrop
}
const VIBES: Record<Treat, Vibe> = {
  chorus: { brightness: 0.88, saturate: 1.5, glow: 2.0, breath: 2.2, scrim: 0.45 },
  verse: { brightness: 0.68, saturate: 1.25, glow: 1.3, breath: 1.3, scrim: 0.55 },
  bridge: { brightness: 0.50, saturate: 1.0, glow: 0.7, breath: 0.6, scrim: 0.68 },
};

/* CAMERA MOVEMENT - a virtual camera dollies per section: pushes IN through
   choruses (energy), drifts laterally in verses (documentary calm), settles
   wide in bridges (stillness). Glides between moves over ~8s. */
const CAM_MOVE: Record<Treat, { scale: number; x: number; y: number }> = {
  chorus: { scale: 1.14, x: 0, y: -24 },
  verse: { scale: 1.07, x: -36, y: 12 },
  bridge: { scale: 1.01, x: 28, y: 18 },
};

export default function LyricsMograph({
  cues, header, bpm, accent = "vio", cover, ttmlUrl, audio, sections, credits, slideId = "lyrics",
}: LyricsMographProps) {
  const hex = ACCENT_HEX[accent];
  const dispatch = useShow((s) => s.dispatch);
  const muted = useMuted();

  /* ---------- lyric source: official TTML wins, else cue estimates ---------- */
  const [fetched, setFetched] = useState<string | null>(null);
  useEffect(() => {
    if (!ttmlUrl) { setFetched(null); return; }
    let dead = false;
    fetch(ttmlUrl).then((r) => r.text()).then((t) => { if (!dead) setFetched(t); }).catch(() => {});
    return () => { dead = true; };
  }, [ttmlUrl]);

  const parsed = useMemo(
    () => (fetched ? parseTtml(fetched) : cuesToLines(cues)),
    [fetched, cues],
  );
  const lines = parsed.lines;

  const sectionsResolved = useMemo(
    () => (sections?.length ? sections : cues.filter((c) => c.label).map((c) => ({ t: c.t, label: c.label as string }))),
    [sections, cues],
  );

  /* ---------- runtime state ---------- */
  const manualMode = !audio;
  const [cur, setCur] = useState(-1);          /* active line index (-1 = intro) */
  const [playing, setPlaying] = useState(false);
  const [section, setSection] = useState(sectionsResolved[0]?.label ?? "");
  const [audioDur, setAudioDur] = useState(0);
  const total = audioDur || parsed.duration || 1;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const shakeRef = useRef<HTMLDivElement>(null);
  const idxRef = useRef(-1);
  const sweepRef = useRef(0);                  /* seconds since line start (manual) */
  const pausedRef = useRef(false);
  const lastNowRef = useRef(0);
  const sectionRef = useRef("");
  const wordElsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const lineWordsRef = useRef<LyricWord[]>([]);
  const treatRef = useRef<Treat>("verse");
  /* ONE-BUTTON word stepping (band mode): how many words of the current
     line are lit; the stage's right-arrow advances it word by word */
  const wordCursorRef = useRef(0);
  const endedRef = useRef(false);

  useEffect(() => { lineWordsRef.current = lines[cur]?.words ?? []; }, [cur, lines]);
  /* ---------- shared command handler (keys + operator console) ---------- */
  const idxForTime = (t: number) => {
    if (!lines.length) return -1;
    const last = lines[lines.length - 1];
    /* When the last line has finished and held for ~3.5s (song outro/ending),
       bring back the intro title card so the performer credits close the performance! */
    if (last && t >= last.end + 3.5) return -1;
    let i = -1;
    for (let k = 0; k < lines.length; k++) if (lines[k].t <= t) i = k;
    return i;
  };
  const setLine = (i: number, lightAll = false) => {
    const clamped = Math.max(-1, Math.min(lines.length - 1, i));
    idxRef.current = clamped;
    sweepRef.current = 0;
    /* console-driven line jumps light the WHOLE line (the operator owns it);
       word-stepping starts a fresh line dark and lights word 1 on advance */
    wordCursorRef.current = lightAll ? (clamped >= 0 ? lines[clamped].words.length : 0) : clamped >= 0 ? 1 : 0;
    wordElsRef.current.forEach((el) => el?.classList.remove("on"));
    setCur(clamped);
  };
  const applyCmd = (action: string, line?: number) => {
    const a = audioRef.current;
    if (a) {
      switch (action) {
        case "play": void a.play(); break;
        case "pause": a.pause(); break;
        case "restart": a.currentTime = 0; setLine(-1); void a.play(); break;
        case "next": {
          const curIdx = idxForTime(a.currentTime);
          /* hold on the final line — never jump back to the intro card */
          if (curIdx >= lines.length - 1) break;
          a.currentTime = lines[curIdx + 1]?.t ?? 0;
          break;
        }
        case "prev": a.currentTime = lines[Math.max(0, idxForTime(a.currentTime) - 1)]?.t ?? 0; break;
        case "goto": if (line != null && lines[line]) a.currentTime = lines[line].t; break;
      }
    } else {
      switch (action) {
        case "play": pausedRef.current = false; setPlaying(true); break;
        case "pause": pausedRef.current = true; setPlaying(false); break;
        case "restart": pausedRef.current = false; setPlaying(true); setLine(-1, true); break;
        case "next": {
          /* hold on the final line — never jump back to the intro card */
          if (idxRef.current >= lines.length - 1) break;
          setLine(idxRef.current + 1, true);
          break;
        }
        case "prev": setLine(idxRef.current - 1, true); break;
        case "goto": if (line != null) setLine(line, true); break;
      }
    }
  };

  /* ---------- THE ONE-BUTTON ADVANCE (right arrow) ----------
     Track mode: starts the backing track, then protects the cue while it
     plays (the track is the clock). After the track ends, the advance
     passes through to the next cue.
     Band mode (no track): WORD BY WORD — each press lights the next word;
     a fresh line starts on the press after the last word of a line. */
  useSlideAction(() => {
    if (audio) {
      if (muted) return true; /* muted monitor: never skip a lyric cue */
      const a = audioRef.current;
      if (!a) return false;
      if (endedRef.current) return false; /* track finished → next cue */
      if (a.paused) {
        void a.play();
        return true;
      }
      return true; /* playing — the track owns the show */
    }
    /* band mode */
    if (idxRef.current < 0) {
      if (!lines.length) return false;
      setLine(0); /* cursor = 1, the rAF lights word 0 */
      return true;
    }
    const words = lineWordsRef.current;
    if (wordCursorRef.current < words.length) {
      wordCursorRef.current++;
      return true;
    }
    if (idxRef.current < lines.length - 1) {
      setLine(idxRef.current + 1);
      return true;
    }
    return false; /* last line fully lit → next cue */
  });

  /* ---------- the clock + word sweep (one rAF, zero re-renders) ---------- */
  useEffect(() => {
    let raf = 0;
    lastNowRef.current = performance.now();
    const tick = (now: number) => {
      const dt = (now - lastNowRef.current) / 1000;
      lastNowRef.current = now;
      const a = audioRef.current;

      /* manual mode: sweep advances while unpaused */
      if (!a && !pausedRef.current) sweepRef.current += dt;

      const time = a
        ? a.currentTime
        : (idxRef.current >= 0 ? lines[idxRef.current].t + sweepRef.current : 0);

      /* which line is active */
      let idx = idxRef.current;
      if (a) idx = idxForTime(time);
      if (idx !== idxRef.current) {
        idxRef.current = idx;
        sweepRef.current = 0;
        setCur(idx);
      }

      /* word-by-word kinetic lighting (direct DOM - no re-render).
         Track mode: locked to audio playback clock.
         Band mode (no track): locked to the word cursor — the right-arrow
         on the stage lights one word per press, nothing auto-advances. */
      const words = lineWordsRef.current;
      const els = wordElsRef.current;
      const curLine = idxRef.current >= 0 ? lines[idxRef.current] : null;
      const lineStart = curLine ? curLine.t : 0;

      for (let i = 0; i < words.length; i++) {
        const el = els[i];
        if (!el) continue;
        const wordOffset = Math.max(0, words[i].t - lineStart);
        const isWordLit = a
          ? time >= words[i].t
          : i < wordCursorRef.current;
        if (isWordLit) el.classList.add("on");
        else el.classList.remove("on");
      }

      /* progress + clock */
      if (barRef.current) barRef.current.style.width = `${Math.min(1, time / total) * 100}%`;
      if (clockRef.current) clockRef.current.textContent = fmtClock(time);

      /* section badge */
      const sec = sectionAt(time, sectionsResolved);
      if (sec !== sectionRef.current) {
        sectionRef.current = sec;
        setSection(sec);
      }
      /* buttery-smooth passive camera float (ultra-low frequency breathing drift).
         Muted monitor: skip entirely — it's a reference view, save the GPU. */
      if (shakeRef.current && !muted) {
        const tSec = now / 1000;
        const treatCur = treatRef.current;
        const intensity = treatCur === "chorus" ? 1.15 : treatCur === "bridge" ? 0.6 : 0.9;
        const sx =
          (Math.sin(tSec * 0.28) * 0.7 + Math.cos(tSec * 0.15 + 1.1) * 0.3) *
          3.2 *
          intensity;
        const sy =
          (Math.cos(tSec * 0.22 + 0.6) * 0.7 + Math.sin(tSec * 0.12 + 2.3) * 0.3) *
          2.4 *
          intensity;
        const sRot = Math.sin(tSec * 0.18 + 0.9) * 0.10 * intensity;

        shakeRef.current.style.transform = `translate3d(${sx.toFixed(2)}px, ${sy.toFixed(2)}px, 0) rotate(${sRot.toFixed(3)}deg)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [lines, total, sectionsResolved]);

  /* ---------- operator console in /lyrics drives this slide ---------- */
  useEffect(() => {
    const t = getTransport();
    const unsub = t.subscribe((ev) => {
      if (ev.type !== "lyric-cmd" || ev.slideId !== slideId) return;
      applyCmd(ev.action, ev.line);
    });
    return unsub;
  }); /* re-subscribe every render: applyCmd must see fresh state */

  /* ---------- stage keys ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyP") { applyCmd(audioRef.current && audioRef.current.paused ? "play" : "pause"); e.stopImmediatePropagation(); }
      else if (e.code === "ArrowDown") { applyCmd("next"); e.stopImmediatePropagation(); }
      else if (e.code === "ArrowUp") { applyCmd("prev"); e.stopImmediatePropagation(); }
      else if (e.code === "KeyR") { applyCmd("restart"); e.stopImmediatePropagation(); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }); /* fresh closure every render */

  /* ---------- broadcast status to the operator console ---------- */
  useEffect(() => {
    if (muted) return; /* the muted monitor doesn't fight the stage for state */
    dispatch({
      type: "lyric-state",
      slideId,
      song: header.song,
      artist: header.artist,
      manual: manualMode,
      playing,
      line: cur,
      lines: lines.map((l) => l.text),
      section,
    });
  }, [dispatch, slideId, header.song, header.artist, manualMode, playing, cur, lines, section]);

  /* leaving the slide -> tell the console we're gone */
  useEffect(() => () => {
    dispatch({ type: "lyric-state", slideId: "", manual: true, playing: false, line: -1, lines: [] });
  }, [dispatch]);

  const line = cur >= 0 ? lines[cur] : null;
  const next = cur + 1 < lines.length ? lines[cur + 1] : null;
  const treat = treatFor(line ? sectionAt(line.t, sectionsResolved) : section);
  const vibe = VIBES[treat];
  useEffect(() => {
    treatRef.current = treat;
  }, [treat]);

  /* SMOOTH CINEMATIC CAMERA — glides gracefully between musical sections (never jerks per line) */
  const camTarget = useMemo(() => {
    if (cur < 0) return { scale: 1.02, x: 0, y: 0, rotate: 0 };
    switch (treat) {
      case "chorus":
        return { scale: 1.10, x: 0, y: -14, rotate: 0 };
      case "bridge":
        return { scale: 1.00, x: 12, y: 10, rotate: 0.12 };
      case "verse":
      default:
        return { scale: 1.04, x: -16, y: 6, rotate: -0.15 };
    }
  }, [treat, cur < 0]);

  const isEven = cur % 2 === 0;
  const lineMotion = treat === "chorus"
    ? {
        initial: { y: 80, opacity: 0, scale: 0.92, filter: "blur(14px)" },
        animate: { y: 0, opacity: 1, scale: 1, filter: "blur(0px)" },
        exit: { y: -80, opacity: 0, scale: 0.95, filter: "blur(12px)" },
        transition: { type: "spring" as const, stiffness: 220, damping: 24, mass: 0.8 },
      }
    : treat === "bridge"
    ? {
        initial: { y: 40, opacity: 0, scale: 0.98, filter: "blur(18px)" },
        animate: { y: 0, opacity: 1, scale: 1, filter: "blur(0px)" },
        exit: { y: -35, opacity: 0, filter: "blur(14px)" },
        transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] as const },
      }
    : {
        initial: { y: 65, opacity: 0, scale: 0.97, filter: "blur(10px)" },
        animate: { y: 0, opacity: 1, scale: 1, filter: "blur(0px)" },
        exit: { y: -55, opacity: 0, scale: 0.98, filter: "blur(8px)" },
        transition: { type: "spring" as const, stiffness: 200, damping: 24 },
      };

  const getWordMotion = (i: number) => {
    if (treat === "chorus") {
      return {
        initial: {
          y: isEven ? "0.65em" : "-0.55em",
          scale: 0.72,
          opacity: 0,
          rotateX: isEven ? 30 : -25,
          rotateZ: i % 2 === 0 ? 3 : -3,
          filter: "blur(8px)",
        },
        animate: {
          y: "0em",
          scale: 1,
          opacity: 1,
          rotateX: 0,
          rotateZ: 0,
          filter: "blur(0px)",
        },
        transition: {
          type: "spring" as const,
          stiffness: 480,
          damping: 26,
          delay: i * 0.038,
        },
      };
    }
    if (treat === "bridge") {
      return {
        initial: {
          y: "0.45em",
          scale: 0.92,
          opacity: 0,
          filter: "blur(18px)",
        },
        animate: {
          y: "0em",
          scale: 1,
          opacity: 1,
          filter: "blur(0px)",
        },
        transition: {
          duration: 0.7,
          ease: [0.16, 1, 0.3, 1] as const,
          delay: i * 0.065,
        },
      };
    }
    return {
      initial: {
        y: "0.85em",
        x: i % 2 === 0 ? -14 : 14,
        opacity: 0,
        skewX: isEven ? 5 : -5,
        filter: "blur(10px)",
      },
      animate: {
        y: "0em",
        x: 0,
        opacity: 1,
        skewX: 0,
        filter: "blur(0px)",
      },
      transition: {
        type: "spring" as const,
        stiffness: 380,
        damping: 28,
        delay: i * 0.045,
      },
    };
  };

  return (
    <div
      className="absolute inset-0 overflow-hidden bg-[#141111]"
      style={{
        /* this engine paints its own dark backdrop — pin the ice token back
           to off-white so SlideShell's page-light flip can't darken the text */
        "--lw-accent": hex,
        "--color-ice": "#eeeded",
      } as CSSProperties}
    >
      {audio && !muted && (
        <audio
          ref={audioRef}
          src={audio}
          preload="auto"
          className="hidden"
          onPlay={() => { endedRef.current = false; setPlaying(true); }}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            endedRef.current = true;
            setPlaying(false);
            setLine(-1);
            if (audioRef.current) audioRef.current.currentTime = 0;
          }}
          onLoadedMetadata={(e) => setAudioDur(e.currentTarget.duration || 0)}
        />
      )}

      {/* ---------- PASSIVE HANDHELD CAMERA DRIFT LAYER ---------- */}
      <div ref={shakeRef} className="absolute inset-0 will-change-transform">
        {/* ---------- CAMERA RIG — responsive virtual camera with dynamic section tracking ---------- */}
        <motion.div
          className="absolute inset-0"
          animate={camTarget}
          transition={{ duration: 5.5, ease: [0.25, 0.1, 0.25, 1] }}
        >
      {/* ---------- backdrop: cover art, blurred, slow cinematic drift ----------
          outer layer = the drift; inner layer = adaptive lighting per section.
          Oversized just enough (15%) for the dolly + drift to never pull a
          dark edge into frame — blur cost scales with layer area, so this
          stays cheap on the 1080p stage. */}
      <motion.div
        className="absolute -inset-[15%]"
        animate={
          muted
            ? { scale: 1.08 }
            : { scale: [1.08, 1.2], x: [0, -70], y: [0, 44] }
        }
        transition={
          muted
            ? { duration: 0.4 }
            : { duration: 30, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }
        }
      >
        <motion.div
          className="h-full w-full bg-cover bg-center"
          style={{
            backgroundImage: cover
              ? `url(${cover})`
              : `radial-gradient(ellipse at 30% 20%, ${hex}30, transparent 60%), radial-gradient(ellipse at 70% 80%, ${hex}22, transparent 55%)`,
          }}
          initial={{ filter: "blur(24px) saturate(1.15) brightness(0.5)" }}
          animate={{ filter: `blur(24px) saturate(${vibe.saturate}) brightness(${vibe.brightness})` }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
        />
      </motion.div>
      {/* ---------- BACKDROP SHADING & VIGNETTE (Behind the text) ---------- */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(130% 130% at 50% 50%, rgba(20,17,17,0.35) 0%, rgba(20,17,17,0.65) 60%, rgba(20,17,17,0.85) 100%)",
        }}
        animate={{ opacity: vibe.scrim }}
        transition={{ duration: 1.4, ease: "easeInOut" }}
      />
      <div className="vignette pointer-events-none absolute inset-0 z-0" />
      {/* ---------- centre stack ---------- */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-[7%] text-center">
        {/* section badge */}
        <div className="flex h-12 items-center">
          <AnimatePresence mode="wait">
            {line && (
              <motion.div
                key={section + String(cur >= 0)}
                initial={{ opacity: 0, y: -14, letterSpacing: "0.8em" }}
                animate={{ opacity: 1, y: 0, letterSpacing: "0.4em" }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="border px-5 py-1.5 font-mono text-[15px] font-semibold uppercase"
                style={{ borderColor: `${hex}55`, color: hex, background: "#141111cc" }}
              >
                {section}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* the line itself - or the intro title card before the first word */}
        <div className="relative mt-6 flex min-h-[38vh] w-full max-w-[90%] items-center justify-center">
          <AnimatePresence mode="wait">
            {line ? (
              <motion.div
                key={cur}
                className={`will-change-transform ${TREAT_FONT[treat].caps ? "uppercase" : ""}`}
                style={{
                  fontFamily: TREAT_FONT[treat].family,
                  fontSize: fitSize(TREAT_FONT[treat].size, line.text),
                  fontWeight: treat === "verse" ? 700 : 400,
                  fontStyle: TREAT_FONT[treat].serif ? "italic" : undefined,
                  letterSpacing: treat === "chorus" ? "0.015em" : undefined,
                  lineHeight: treat === "bridge" ? 1.12 : 1.04,
                }}
                initial={lineMotion.initial}
                animate={lineMotion.animate}
                exit={lineMotion.exit}
                transition={lineMotion.transition}
              >
                {line.words.map((w, i) => {
                  const wm = getWordMotion(i);
                  return (
                    <motion.span
                      key={i}
                      ref={(el) => { wordElsRef.current[i] = el; }}
                      className={`lw inline-block will-change-transform ${treat === "chorus" ? "accent-on" : ""}`}
                      style={{ marginRight: "0.26em" }}
                      initial={wm.initial}
                      animate={wm.animate}
                      transition={wm.transition}
                    >
                      {w.text}
                    </motion.span>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50, filter: "blur(14px)" }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="font-mono text-[17px] font-medium tracking-[0.5em]" style={{ color: hex }}>
                  {header.kind}
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 176, lineHeight: 0.9 }}>
                  <LetterStagger
                    text={header.song}
                    className="font-black uppercase text-ice"
                  />
                </div>
                <motion.div
                  className="mx-auto mt-6 h-[3px] w-32"
                  style={{ background: hex }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.55, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                />
                <div className="mt-5 font-body text-[34px] font-medium tracking-[0.2em] text-ice/70">
                  {header.artist}
                </div>
                {/* PERFORMED BY - staged credits, gig-poster voice */}
                {credits?.length ? (
                  <div className="mt-14 flex flex-col items-center gap-6">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.85, duration: 0.8 }}
                      className="font-mono text-[13px] font-medium tracking-[0.55em]"
                      style={{ color: `${hex}cc` }}
                    >
                      PERFORMED BY
                    </motion.div>
                    {credits.map((c, i) => (
                      <motion.div
                        key={c.role}
                        initial={{ opacity: 0, y: 26 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 + i * 0.25, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        className="flex items-center gap-4"
                      >
                        <span
                          className="font-mono text-[15px] font-semibold tracking-[0.35em]"
                          style={{ color: hex }}
                        >
                          {c.role}
                        </span>
                        <span className="h-px w-12" style={{ background: `${hex}66` }} />
                        <span className="font-body text-[32px] font-bold tracking-[0.03em] text-ice/70">
                          {c.names.join("  ·  ")}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
        </motion.div>
      </div>


      {/* ---------- bottom chrome: song info - clock - progress rail ---------- */}
      <div className="absolute inset-x-0 bottom-0 z-20">
        <div className="flex items-end justify-between px-10 pb-7">
          <div className="flex items-center gap-5">
            {cover && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={cover} alt="" className="h-[74px] w-[74px] object-cover opacity-90" draggable={false} />
            )}
            <div>
              <div className="flex items-center gap-3">
                <motion.span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: hex }}
                  animate={{ opacity: playing ? [1, 0.2, 1] : 0.3 }}
                  transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
                />
                <span className="font-body text-[15px] font-bold tracking-[0.3em] text-ice/85">
                  NOW PERFORMING
                </span>
              </div>
              <div className="mt-1 font-body text-[26px] font-bold tracking-[0.08em] text-ice">
                {header.song} <span className="text-ice/50">- {header.artist}</span>
              </div>
              {credits?.length ? (
                <div className="mt-1.5 font-mono text-[12px] font-medium tracking-[0.14em] text-ice/55">
                  {credits
                    .map((c) => `${c.role} — ${c.names.join(" · ").toUpperCase()}`)
                    .join("   /   ")}
                </div>
              ) : null}
            </div>
          </div>
          <div className="text-right">
            {/* TRACK mode only: a reminder until the track starts.
                MANUAL mode shows nothing here - the /lyrics operator owns it. */}
            {audio && !playing && (
              <div className="inline-block border px-4 py-1.5 text-[15px] font-bold tracking-[0.3em]" style={{ borderColor: `${hex}66`, color: hex }}>
                {muted ? "MUTED MONITOR - TRACK PLAYS ON STAGE" : "PRESS RIGHT ARROW TO START THE TRACK"}
              </div>
            )}
            {!audio && cur < 0 && (
              <div className="inline-block border px-4 py-1.5 text-[15px] font-bold tracking-[0.3em]" style={{ borderColor: `${hex}66`, color: hex }}>
                LIVE BAND - PRESS RIGHT ARROW, WORD BY WORD
              </div>
            )}
            <div className="mt-2 font-body text-[22px] font-bold tracking-[0.2em] text-ice/70">
              <span ref={clockRef}>0:00</span>
              <span className="text-ice/35"> / {fmtClock(total)}</span>
            </div>
          </div>
        </div>
        <div className="h-[5px] w-full bg-white/[0.07]">
          <div ref={barRef} className="h-full w-0" style={{ background: hex }} />
        </div>
      </div>
    </div>
  );
}