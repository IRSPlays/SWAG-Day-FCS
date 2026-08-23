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
   console taps lines along in MANUAL mode (lyric-cmd over the transport).
   Stage keys still work: P play/pause, arrows next/prev, R restart. */

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { LyricCue, SongHeader } from "@/slides/lyrics";
import { LetterStagger } from "@/animations";
import { getTransport } from "@/realtime/transport";
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
  volt: "#23dcff",
  mag: "#ff3da6",
  vio: "#8f6bff",
};

type Treat = "chorus" | "bridge" | "verse";

function treatFor(label: string): Treat {
  const l = (label || "").toUpperCase();
  if (l.includes("CHORUS") || l.includes("HOOK") || l.includes("LIFT") || l.includes("FINALE"))
    return "chorus";
  if (l.includes("BRIDGE")) return "bridge";
  return "verse";
}

const TREAT_CLASS: Record<Treat, string> = {
  chorus: "font-display uppercase text-[148px] leading-[1.02] tracking-[0.015em]",
  bridge: "font-serifit italic text-[112px] leading-[1.12]",
  verse: "font-body font-bold text-[100px] leading-[1.12] tracking-tight",
};

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
  chorus: { brightness: 0.78, saturate: 1.45, glow: 1.6, breath: 1.9, scrim: 0.62 },
  verse: { brightness: 0.5, saturate: 1.15, glow: 1, breath: 1, scrim: 0.82 },
  bridge: { brightness: 0.3, saturate: 0.85, glow: 0.45, breath: 0.5, scrim: 0.92 },
};

/* CAMERA MOVEMENT - a virtual camera dollies per section: pushes IN through
   choruses (energy), drifts laterally in verses (documentary calm), settles
   wide in bridges (stillness). Glides between moves over ~8s. */
const CAM_MOVE: Record<Treat, { scale: number; x: number; y: number }> = {
  chorus: { scale: 1.085, x: 0, y: -12 },
  verse: { scale: 1.035, x: -18, y: 6 },
  bridge: { scale: 1.005, x: 14, y: 10 },
};

export default function LyricsMograph({
  cues, header, bpm, accent = "vio", cover, ttmlUrl, audio, sections, credits, slideId = "lyrics",
}: LyricsMographProps) {
  const hex = ACCENT_HEX[accent];
  const dispatch = useShow((s) => s.dispatch);

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
  const idxRef = useRef(-1);
  const sweepRef = useRef(0);                  /* seconds since line start (manual) */
  const pausedRef = useRef(false);
  const lastNowRef = useRef(0);
  const sectionRef = useRef("");
  const wordElsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const lineWordsRef = useRef<LyricWord[]>([]);

  useEffect(() => { lineWordsRef.current = lines[cur]?.words ?? []; }, [cur, lines]);
  /* ---------- shared command handler (keys + operator console) ---------- */
  const idxForTime = (t: number) => {
    let i = -1;
    for (let k = 0; k < lines.length; k++) if (lines[k].t <= t) i = k;
    return i;
  };
  const setLine = (i: number) => {
    const clamped = Math.max(-1, Math.min(lines.length - 1, i));
    idxRef.current = clamped;
    sweepRef.current = 0;
    setCur(clamped);
  };
  const applyCmd = (action: string, line?: number) => {
    const a = audioRef.current;
    if (a) {
      switch (action) {
        case "play": void a.play(); break;
        case "pause": a.pause(); break;
        case "restart": a.currentTime = 0; void a.play(); break;
        case "next": a.currentTime = lines[Math.min(lines.length - 1, idxForTime(a.currentTime) + 1)]?.t ?? 0; break;
        case "prev": a.currentTime = lines[Math.max(0, idxForTime(a.currentTime) - 1)]?.t ?? 0; break;
        case "goto": if (line != null && lines[line]) a.currentTime = lines[line].t; break;
      }
    } else {
      switch (action) {
        case "play": pausedRef.current = false; setPlaying(true); break;
        case "pause": pausedRef.current = true; setPlaying(false); break;
        case "restart": pausedRef.current = false; setPlaying(true); setLine(0); break;
        case "next": setLine(idxRef.current + 1); break;
        case "prev": setLine(idxRef.current - 1); break;
        case "goto": if (line != null) setLine(line); break;
      }
    }
  };

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

      /* word-by-word lighting (direct DOM - no re-render).
         MANUAL mode: no track timing exists, so the whole line is revealed
         lit the moment it lands - the operator's tap IS the timing. */
      const words = lineWordsRef.current;
      const els = wordElsRef.current;
      for (let i = 0; i < words.length; i++) {
        const el = els[i];
        if (!el) continue;
        if (!a || time >= words[i].t) el.classList.add("on");
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
  return (
    <div
      className="absolute inset-0 overflow-hidden bg-[#07050f]"
      style={{ "--lw-accent": hex, "--lw-glow": `${hex}80` } as CSSProperties}
    >
      {audio && (
        <audio
          ref={audioRef}
          src={audio}
          preload="auto"
          className="hidden"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onLoadedMetadata={(e) => setAudioDur(e.currentTarget.duration || 0)}
        />
      )}

      {/* ---------- CAMERA RIG — the whole scene rides a virtual camera that
             dollies per section (CAM_MOVE). Bottom HUD stays fixed outside. ---------- */}
      <motion.div
        className="absolute inset-0"
        animate={CAM_MOVE[treat]}
        transition={{ duration: 8, ease: [0.22, 1, 0.36, 1] }}
      >
      {/* ---------- backdrop: cover art, blurred, slow cinematic drift ---------- */}
      {/* outer layer = the drift; inner layer = adaptive lighting per section */}
      <motion.div
        className="absolute -inset-[12%]"
        animate={{ scale: [1.05, 1.15], x: [0, -44], y: [0, 26] }}
        transition={{ duration: 30, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      >
        <motion.div
          className="h-full w-full bg-cover bg-center"
          style={{
            backgroundImage: cover
              ? `url(${cover})`
              : `radial-gradient(ellipse at 30% 20%, ${hex}30, transparent 60%), radial-gradient(ellipse at 70% 80%, ${hex}22, transparent 55%)`,
          }}
          initial={{ filter: "blur(36px) saturate(1.15) brightness(0.5)" }}
          animate={{ filter: `blur(36px) saturate(${vibe.saturate}) brightness(${vibe.brightness})` }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
        />
      </motion.div>
      {/* aurora - two accent blobs breathing at the song's BPM, flaring with the vibe */}
      <motion.div
        className="absolute -left-[6%] top-[10%] h-[52vh] w-[52vh] rounded-full"
        style={{ background: `radial-gradient(circle, ${hex}30, transparent 65%)`, filter: "blur(70px)", mixBlendMode: "screen" }}
        animate={{
          x: [0, 110, 0],
          scale: [1, 1 + 0.12 * vibe.glow, 1],
          opacity: [0.65 * vibe.glow, Math.min(1, vibe.glow), 0.65 * vibe.glow],
        }}
        transition={{
          x: { duration: (60 / bpm) * 8, repeat: Infinity, ease: "easeInOut" },
          scale: { duration: (60 / bpm) * 4 / vibe.breath, repeat: Infinity, ease: "easeInOut" },
          opacity: { duration: (60 / bpm) * 8 / vibe.breath, repeat: Infinity, ease: "easeInOut" },
        }}
      />
      <motion.div
        className="absolute -right-[8%] bottom-[6%] h-[60vh] w-[60vh] rounded-full"
        style={{ background: `radial-gradient(circle, ${hex}24, transparent 65%)`, filter: "blur(90px)", mixBlendMode: "screen" }}
        animate={{
          x: [0, -130, 0],
          scale: [1, 1 + 0.1 * vibe.glow, 1],
          opacity: [Math.min(1, vibe.glow), 0.55 * vibe.glow, Math.min(1, vibe.glow)],
        }}
        transition={{
          x: { duration: (60 / bpm) * 11, repeat: Infinity, ease: "easeInOut" },
          scale: { duration: (60 / bpm) * 5 / vibe.breath, repeat: Infinity, ease: "easeInOut" },
          opacity: { duration: (60 / bpm) * 11 / vibe.breath, repeat: Infinity, ease: "easeInOut" },
        }}
      />
      <motion.div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(7,5,15,0.5), rgba(7,5,15,0.82) 65%, rgba(7,5,15,0.95))" }}
        animate={{ opacity: vibe.scrim }}
        transition={{ duration: 1.4, ease: "easeInOut" }}
      />
      <div className="vignette absolute inset-0" />

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
                style={{ borderColor: `${hex}55`, color: hex, background: "#07050fcc" }}
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
                className={`${TREAT_CLASS[treat]} text-ice`}
                initial={{ y: 110, opacity:  0, scale: 0.93, filter: "blur(16px)" }}
                animate={{ y: 0, opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ y: -90, opacity: 0, scale: 0.97, filter: "blur(12px)" }}
                transition={{ type: "spring", stiffness: 170, damping: 24, mass: 0.9 }}
              >
                {line.words.map((w, i) => (
                  <motion.span
                    key={i}
                    ref={(el) => { wordElsRef.current[i] = el; }}
                    className={`lw inline-block will-change-transform ${treat === "chorus" ? "accent-on" : ""}`}
                    style={{ marginRight: "0.26em" }}
                    /* alternate entrance direction per line - even lines whip
                       up, odd lines drop in; chorus springs are snappier */
                    initial={{
                      y: cur % 2 === 0 ? "0.55em" : "-0.55em",
                      rotate: cur % 2 === 0 ? 2 : -2,
                      opacity: 0,
                    }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: treat === "chorus" ? 520 : 420,
                      damping: 30,
                      delay: i * (treat === "chorus" ? 0.04 : 0.05),
                    }}
                  >
                    {w.text}
                  </motion.span>
                ))}
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
                <LetterStagger
                  text={header.song}
                  className="mt-5 font-display text-[170px] font-black uppercase leading-[0.9] text-ice"
                />
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
                        <span className="font-body text-[32px] font-bold tracking-[0.03em] text-ice/90">
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

        {/* next-line ghost */}
        <div className="mt-4 flex h-16 items-center justify-center">
          <AnimatePresence mode="wait">
            {next && (
              <motion.div
                key={cur}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 0.3, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="font-body text-[32px] font-semibold text-ice"
                style={{ filter: "blur(1.2px)" }}
              >
                {next.text}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      </motion.div>

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
                PRESS P TO PLAY - OR DRIVE FROM /LYRICS
              </div>
            )}
            <div className="mt-2 font-body text-[22px] font-bold tracking-[0.2em] text-ice/70">
              <span ref={clockRef}>0:00</span>
              <span className="text-ice/35"> / {fmtClock(total)}</span>
            </div>
          </div>
        </div>
        <div className="h-[5px] w-full bg-white/[0.07]">
          <div ref={barRef} className="h-full w-0" style={{ background: hex, boxShadow: `0 0 18px ${hex}` }} />
        </div>
      </div>
    </div>
  );
}