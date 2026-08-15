"use client";

/* AmLyricsStage - performance slide powered by the real am-lyrics engine
   (github.com/binimum/am-lyrics - the Monochrome lyric system). Apple-Music
   style monochrome stack: active line bright + scaled, upcoming lines blurred
   and dimmed, word-by-word interpolated highlight, buttery autoscroll.

   Layout: cover art + song header on the LEFT, the lyric stack on the RIGHT.
   Drive-by: the stage keys still tap the band along - ArrowDown next line,
   ArrowUp prev, R re-sync to the clock. Lyrics are fed via the TTML prop so
   NOTHING is fetched from the internet at the live show. */

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import type { LyricCue, SongHeader } from "@/slides/lyrics";
import { LetterStagger } from "@/animations";

export interface AmLyricsStageProps {
  cues: LyricCue[];
  header: SongHeader;
  bpm: number;
  accent?: "volt" | "mag" | "vio";
  /** image under /public - drop a real single/album cover here for the show */
  cover?: string;
  /** base lyric font size in px (active + upcoming lines scale from this).
   *  58px reads well from the back of a hall; bump for stadium throws. */
  lyricSize?: number;
  /** URL to an official word-synced TTML (e.g. /lyrics/pulang.ttml). When set it
   *  REPLACES the locally generated timing estimate - real word-level sync. */
  ttmlUrl?: string;
  /** path to the song file under /public. When set, the stage plays the track
   *  itself (P = play/pause) and the lyrics lock to the audio clock: perfect
   *  sync, tap-along arrows jump the TRACK to a line. */
  audio?: string;
  /** section markers for the stage badge, in SONG time (seconds) */
  sections?: { t: number; label: string }[];
}

const ACCENT_HEX: Record<string, string> = {
  volt: "#23dcff",
  mag: "#ff3da6",
  vio: "#8f6bff",
};

/* ---------- cue list -> TTML (word-synced, generated locally) ---------- */

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function msFmt(sec: number) {
  const ms = Math.max(0, Math.round(sec * 1000));
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  const f = String(ms % 1000).padStart(3, "0");
  return `${h}:${m}:${s}.${f}`;
}

function buildTtml(cues: LyricCue[]): string {
  const lines = cues.map((c, i) => {
    const begin = c.t;
    const end = i + 1 < cues.length ? cues[i + 1].t : c.t + 4;
    const dur = end - begin;
    const words = c.text.split(/\s+/).filter(Boolean);
    /* spread words across the line weighted by length -> natural sing-along sweep */
    const weights = words.map((w) => Math.max(2, w.replace(/[^\p{L}\p{N}]/gu, "").length));
    const total = weights.reduce((a, b) => a + b, 0);
    let cursor = begin;
    const spans = words
      .map((w, k) => {
        const wDur = (weights[k] / total) * dur;
        const sp = `<span begin="${msFmt(cursor)}" end="${msFmt(cursor + wDur)}">${esc(w)}</span>`;
        cursor += wDur;
        return sp;
      })
      .join(" ");
    return `      <p begin="${msFmt(begin)}" end="${msFmt(end)}" ttm:agent="${c.label ?? c.style}">${spans}</p>`;
  });
  return `<tt xmlns="http://www.w3.org/ns/ttml" xmlns:ttm="http://www.w3.org/ns/ttml#metadata" xml:lang="ms">\n  <body>\n    <div>\n${lines.join("\n")}\n    </div>\n  </body>\n</tt>`;
}
/* -------------- TTML mining (line starts / song length / sections) -------------- */

function tcToSec(tc: string): number {
  const m = /^(\d+):(\d+):(\d+(?:\.\d+)?)$/.exec(tc.trim());
  return m ? +m[1] * 3600 + +m[2] * 60 + parseFloat(m[3]) : 0;
}

function parseTtml(doc: string) {
  /* every <p begin="..."> is a sung line - these drive tap-along + sections */
  const lineTimes: number[] = [];
  const pRe = /<p\b[^>]*\bbegin="([^"]+)"[^>]*>/g;
  let m: RegExpExecArray | null;
  while ((m = pRe.exec(doc))) lineTimes.push(tcToSec(m[1]));
  let lastEnd = 0;
  const eRe = /\bend="([^"]+)"/g;
  while ((m = eRe.exec(doc))) lastEnd = Math.max(lastEnd, tcToSec(m[1]));
  return { lineTimes, lastEnd };
}

function sectionAt(t: number, sections: { t: number; label: string }[]): string {
  let s = sections[0]?.label ?? "";
  for (const sec of sections) if (sec.t <= t) s = sec.label;
  return s;
}
/* ------------------------------ component ------------------------------ */

export default function AmLyricsStage({
  cues, header, bpm, accent = "vio", cover, lyricSize = 58, ttmlUrl, audio, sections,
}: AmLyricsStageProps) {
  const hex = ACCENT_HEX[accent];

  /* official word-synced TTML wins; otherwise generate timings from the cue list */
  const [fetched, setFetched] = useState<string | null>(null);
  useEffect(() => {
    if (!ttmlUrl) { setFetched(null); return; }
    let dead = false;
    fetch(ttmlUrl).then((r) => r.text()).then((t) => { if (!dead) setFetched(t); }).catch(() => {});
    return () => { dead = true; };
  }, [ttmlUrl]);
  const generated = useMemo(() => buildTtml(cues), [cues]);
  const ttmlDoc = fetched ?? generated;

  /* line starts + song length straight out of the TTML itself */
  const { lineTimes, lastEnd } = useMemo(() => parseTtml(ttmlDoc), [ttmlDoc]);
  const fallbackTotal = useMemo(() => Math.max(2, lastEnd || (cues[cues.length - 1]?.t ?? 4) + 4), [lastEnd, cues]);
  const [audioDuration, setAudioDuration] = useState(0);
  const total = audioDuration || fallbackTotal;

  const sectionsResolved = useMemo(
    () => (sections?.length ? sections : cues.filter((c) => c.label).map((c) => ({ t: c.t, label: c.label as string }))),
    [sections, cues],
  );

  const hostRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const elRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const t0Ref = useRef<number>(0);
  const offRef = useRef(0);
  const [manual, setManual] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [section, setSection] = useState(sectionsResolved[0]?.label ?? cues[0]?.style ?? "");

  /* mount the am-lyrics custom element (client only) + run the clock */
  useEffect(() => {
    let raf = 0;
    let dead = false;
    let el: any = null;

    import("@uimaxbai/am-lyrics/am-lyrics.js").then(() => {
      if (dead || !hostRef.current) return;
      el = document.createElement("am-lyrics");
      el.ttml = ttmlDoc;
      el.highlightColor = "#f4f7ff";
      el.fontFamily = "'Space Grotesk', 'Segoe UI', sans-serif";
      el.autoscroll = true;
      el.interpolate = true;
      el.style.cssText = "display:block;width:100%;height:100%;";
      /* scale the whole monochrome stack - the engine sizes every line, blur,
         padding and wipe off this single var, so one bump enlarges it all */
      el.style.setProperty("--lyplus-font-size-base", `${lyricSize}px`);
      hostRef.current.appendChild(el);
      elRef.current = el;
      t0Ref.current = performance.now();

      const tick = () => {
        /* audio mode: the track IS the clock - lyrics lock to it exactly.
           no audio: wall clock + manual offset (band tap-along). */
        const t = audioRef.current
          ? audioRef.current.currentTime
          : (performance.now() - t0Ref.current) / 1000 + offRef.current;
        if (elRef.current) elRef.current.currentTime = Math.max(0, t * 1000);
        if (barRef.current) barRef.current.style.width = `${Math.min(1, t / total) * 100}%`;
        setSection((prev) => {
          const next = sectionAt(t, sectionsResolved);
          return prev === next ? prev : next;
        });
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      if (el) el.remove();
      elRef.current = null;
    };
  }, [ttmlDoc, sectionsResolved, total, lyricSize]);

  /* tap-along keys (bands drift - this rescues the sync) */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      /* AUDIO MODE: P = play/pause, arrows jump the TRACK to a line (always
         locked), R restarts from the top. No drift possible. */
      if (audioRef.current) {
        const a = audioRef.current;
        const now = a.currentTime;
        let idx = 0;
        for (let i = 0; i < lineTimes.length; i++) if (lineTimes[i] <= now) idx = i;
        if (e.code === "KeyP") {
          if (a.paused) void a.play();
          else a.pause();
          e.stopImmediatePropagation();
        } else if (e.code === "ArrowDown") {
          a.currentTime = lineTimes[Math.min(lineTimes.length - 1, idx + 1)] ?? now;
          e.stopImmediatePropagation();
        } else if (e.code === "ArrowUp") {
          a.currentTime = lineTimes[Math.max(0, idx - 1)] ?? 0;
          e.stopImmediatePropagation();
        } else if (e.code === "KeyR") {
          a.currentTime = 0;
          e.stopImmediatePropagation();
        }
        return;
      }
      const now = (performance.now() - t0Ref.current) / 1000 + offRef.current;
      let idx = 0;
      for (let i = 0; i < lineTimes.length; i++) if (lineTimes[i] <= now) idx = i;
      if (e.code === "ArrowDown") {
        offRef.current += lineTimes[Math.min(lineTimes.length - 1, idx + 1)] - now;
        setManual(true);
        e.stopImmediatePropagation();
      } else if (e.code === "ArrowUp") {
        offRef.current += lineTimes[Math.max(0, idx - 1)] - now;
        setManual(true);
        e.stopImmediatePropagation();
      } else if (e.code === "KeyR") {
        offRef.current = 0;
        t0Ref.current = performance.now();
        setManual(false);
        e.stopImmediatePropagation();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lineTimes]);

  const beat = 60 / Math.max(40, bpm);
  return (
    <div className="relative h-full w-full select-none">
      {/* sleek backdrop: one soft ambient glow + lanes + vignette. no rings. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute left-[-200px] top-[-300px] h-[1100px] w-[1100px] rounded-full"
          style={{ background: `radial-gradient(circle, ${hex}26 0%, transparent 60%)` }}
          animate={{ opacity: [0.55, 0.8, 0.55] }}
          transition={{ duration: beat * 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="bg-lanes absolute inset-0 opacity-[0.05]" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(120% 90% at 50% 45%, transparent 55%, #08060f 100%)" }} />
      </div>

      {/* the track itself - when present it IS the clock (P = play/pause) */}
      {audio && (
        <audio
          ref={audioRef}
          src={audio}
          preload="auto"
          className="hidden"
          onLoadedMetadata={(e) => setAudioDuration(e.currentTarget.duration || 0)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      )}

      <div className="relative flex h-full w-full items-center gap-[90px] px-[110px]">
        {/* LEFT - cover art + song header */}
        <div className="flex w-[440px] shrink-0 flex-col gap-8">
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 40, rotate: -1.5 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ type: "spring", stiffness: 60, damping: 14 }}
          >
            <motion.div
              className="absolute -inset-8 rounded-[28px]"
              style={{ background: `radial-gradient(closest-side, ${hex}30, transparent)` }}
              animate={{ opacity: [0.5, 0.85, 0.5], scale: [0.98, 1.02, 0.98] }}
              transition={{ duration: beat * 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="relative border border-[#f4f7ff1f] bg-[#0d0a1c] p-[10px]">
              {cover ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={cover} alt={`${header.song} cover art`} className="block h-[420px] w-[420px] object-cover" draggable={false} />
              ) : (
                <div className="h-[420px] w-[420px]" style={{ background: `linear-gradient(140deg, ${hex}22, #0d0a1c)` }} />
              )}
              <div className="absolute right-[22px] top-[22px] flex items-center gap-2 border px-3 py-1.5" style={{ borderColor: `${hex}66`, background: "#08060fdd" }}>
                <motion.span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: hex }}
                  animate={{ opacity: [1, 0.25, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                />
                <span className="text-[13px] font-bold tracking-[0.25em]" style={{ color: hex }}>LIVE</span>
              </div>
            </div>
          </motion.div>

          {/* song progress under the sleeve */}
          <div>
            <div className="h-[3px] w-full bg-[#f4f7ff14]">
              <div ref={barRef} className="h-full w-0" style={{ background: hex, boxShadow: `0 0 12px ${hex}` }} />
            </div>
            <div className="mt-3 flex items-center justify-between text-[12px] font-bold tracking-[0.3em] text-[#f4f7ff66]">
              <span>NOW PERFORMING</span>
              <span style={{ color: hex }}>{section.toUpperCase()}</span>
            </div>
          </div>

          <div>
            <div className="text-[15px] font-bold tracking-[0.45em]" style={{ color: hex }}>
              {header.kind}
            </div>
            <LetterStagger
              text={header.song}
              className="mt-3 font-display text-[76px] font-black leading-[0.95] tracking-tight text-ice"
            />
            <motion.div
              className="mt-4 h-[2px] w-24"
              style={{ background: hex }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
            <div className="mt-4 text-[26px] font-medium tracking-[0.14em] text-[#f4f7ff99]">{header.artist}</div>
            {audio ? (
              !playing && (
                <div
                  className="mt-5 inline-block border px-3 py-1 text-[12px] font-bold tracking-[0.3em]"
                  style={{ borderColor: `${hex}66`, color: hex }}
                >
                  PRESS P TO PLAY THE TRACK
                </div>
              )
            ) : manual ? (
              <div className="mt-5 inline-block border border-[#ff3da655] px-3 py-1 text-[12px] font-bold tracking-[0.3em] text-[#ff3da6]">
                MANUAL - R TO RE-SYNC
              </div>
            ) : null}
          </div>
        </div>

        {/* RIGHT - the am-lyrics monochrome stack */}
        <div className="relative h-[880px] flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28" style={{ background: "linear-gradient(#08060f, transparent)" }} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28" style={{ background: "linear-gradient(transparent, #08060f)" }} />
          <motion.div
            ref={hostRef}
            className="h-full w-full"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>
    </div>
  );
}