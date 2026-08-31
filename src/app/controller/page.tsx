"use client";

/* /controller — THE START TREE. Rebuilt for the one-button show.
    Concept: a drag-race starting-light tree. Every cue in the deck is a
    lamp on the tree; lamps behind you are burnt, the current cue burns
    AMBER, and the GO button (or the RIGHT ARROW — the only control that
    matters) fires the advance: slide action first, then next cue.

    The centre monitor mirrors the stage FULLY MUTED — this console can
    never emit audio; the stage machine owns the PA. */

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import DeckPlayer from "@/engine/DeckPlayer";
import { MuteProvider } from "@/engine/advance";
import { useShow } from "@/store/show";
import { useEffectiveDeck } from "@/store/deckSelect";

const VIO = "#e1811f";
const VOLT = "#4758d6";
const MAG = "#ea3a3a";

function Clock() {
  /* client-only: a wall clock can never match server HTML, so render a
     stable placeholder until mounted */
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!now) {
    return <span className="font-display text-[26px] tabular-nums tracking-tight text-ice/30">--:--</span>;
  }
  return (
    <span className="font-display text-[26px] tabular-nums tracking-tight text-ice">
      {String(now.getHours()).padStart(2, "0")}:{String(now.getMinutes()).padStart(2, "0")}
      <span className="text-ice/40">:{String(now.getSeconds()).padStart(2, "0")}</span>
    </span>
  );
}

function TimerChip({ endsAt }: { endsAt: number }) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((x) => x + 1), 250);
    return () => clearInterval(id);
  }, []);
  const s = Math.ceil(Math.max(0, endsAt - Date.now()) / 1000);
  return (
    <span className="border-2 border-mag px-2 py-0.5 font-display text-lg text-mag tabular-nums">
      {String(Math.floor(s / 60)).padStart(2, "0")}:{String(s % 60).padStart(2, "0")}
    </span>
  );
}

export default function ControllerPage() {
  const init = useShow((s) => s.init);
  const dispatch = useShow((s) => s.dispatch);
  const index = useShow((s) => s.index);
  const dir = useShow((s) => s.dir);
  const blackout = useShow((s) => s.blackout);
  const cameraOn = useShow((s) => s.cameraOn);
  const activeCam = useShow((s) => s.activeCam);
  const cams = useShow((s) => s.cams);
  const timerEndsAt = useShow((s) => s.timerEndsAt);
  const lyric = useShow((s) => s.lyric);
  const transportKind = useShow((s) => s.transportKind);
  const deckList = useEffectiveDeck();

  const treeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    init();
  }, [init]);

  const current = deckList[Math.max(0, Math.min(index, deckList.length - 1))];
  const next = deckList[index + 1] ?? null;

  /* keep the amber lamp in view */
  useEffect(() => {
    treeRef.current
      ?.querySelector<HTMLElement>("[data-lamp='current']")
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [index]);

  const advance = () => dispatch({ type: "advance" });
  const back = () => {
    const s = useShow.getState();
    dispatch({ type: "cue", index: Math.max(0, s.index - 1), dir: -1 });
  };
  const jump = (i: number) => {
    const s = useShow.getState();
    dispatch({ type: "cue", index: i, dir: i >= s.index ? 1 : -1 });
  };

  /* hotkeys: RIGHT ARROW is the show. B blackout. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "ArrowRight" || e.code === "Space") {
        e.preventDefault();
        advance();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        back();
      } else if (e.code === "KeyB") {
        dispatch({ type: "toggle", key: "blackout", on: !useShow.getState().blackout });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch]);

  /* FULL MUTE — belt and braces on top of MuteProvider. Any media element
     that tries to make a sound inside this page (slide audio, the credits
     BGM player, anything) gets muted, zeroed and paused. Capture phase
     catches media events even though they don't bubble. */
  useEffect(() => {
    const silence = (e: Event) => {
      const el = e.target as HTMLMediaElement | null;
      if (el && typeof el.pause === "function") {
        el.muted = true;
        el.volume = 0;
        if (!el.paused) el.pause();
      }
    };
    document.addEventListener("play", silence, true);
    document.addEventListener("playing", silence, true);
    document.addEventListener("volumechange", silence, true);
    return () => {
      document.removeEventListener("play", silence, true);
      document.removeEventListener("playing", silence, true);
      document.removeEventListener("volumechange", silence, true);
    };
  }, []);

  return (
    <div className="page-light flex min-h-screen flex-col bg-court text-ice">
      {/* ── header strip ─────────────────────────────────────────────── */}
      <header className="flex items-center justify-between border-b-2 border-ice/10 px-6 py-2.5">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-xl uppercase tracking-tight text-ice">
            Start Tree
          </span>
          <span className="font-serifit text-[15px] italic text-ice/45">
            SWAG Day '26 · one button, full control
          </span>
        </div>
        <div className="flex items-center gap-5">
          <span
            className="flex items-center gap-2 font-mono text-[11px] font-bold tracking-[0.3em]"
            style={{ color: transportKind === "server" ? VOLT : "#9a9494" }}
          >
            <span
              className={`h-2 w-2 rounded-full ${transportKind === "server" ? "animate-pulse" : ""}`}
              style={{ background: transportKind === "server" ? VOLT : "#9a9494" }}
            />
            {transportKind === "server" ? "SHOW LINK LIVE" : "LOCAL TABS"}
          </span>
          <Clock />
          <nav className="flex gap-2 font-mono text-[11px] font-bold tracking-[0.25em]">
            <Link href="/lyrics" className="border border-ice/20 px-2.5 py-1 text-ice/60 hover:border-volt hover:text-volt">
              LYRICS
            </Link>
            <Link href="/editor" className="border border-ice/20 px-2.5 py-1 text-ice/60 hover:border-volt hover:text-volt">
              EDITOR
            </Link>
            <Link href="/report" className="border border-ice/20 px-2.5 py-1 text-ice/60 hover:border-volt hover:text-volt">
              REPORT
            </Link>
          </nav>
        </div>
      </header>

      <MuteProvider value={true}>
        <main className="grid flex-1 grid-cols-[240px_1fr_300px]">
          {/* ── THE TREE ──────────────────────────────────────────────── */}
          <aside className="flex flex-col border-r-2 border-ice/10">
            <div className="border-b-2 border-ice/10 px-4 py-2 font-mono text-[11px] font-bold tracking-[0.35em] text-ice/45">
              CUE TREE · {deckList.length} LAMPS
            </div>
            <div ref={treeRef} className="flex-1 py-2">
              {deckList.map((m, i) => {
                const state = i < index ? "past" : i === index ? "current" : "future";
                return (
                  <button
                    key={m.meta.id}
                    data-lamp={state}
                    onClick={() => jump(i)}
                    className={`flex w-full items-center gap-3 px-4 py-[7px] text-left transition-colors ${
                      state === "current" ? "bg-vio/10" : "hover:bg-ice/5"
                    }`}
                  >
                    {/* the lamp */}
                    <span
                      className="relative h-[18px] w-[18px] shrink-0 rounded-full border-2"
                      style={{
                        borderColor: state === "current" ? VIO : "#5a5454",
                        background:
                          state === "current"
                            ? VIO
                            : state === "past"
                              ? "#5a5454"
                              : "transparent",
                      }}
                    >
                      {state === "current" && (
                        <motion.span
                          className="absolute -inset-1.5 rounded-full border"
                          style={{ borderColor: VIO }}
                          animate={{ opacity: [0.9, 0.25, 0.9], scale: [1, 1.25, 1] }}
                          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                        />
                      )}
                    </span>
                    <span
                      className={`w-7 shrink-0 font-display text-[17px] tabular-nums ${
                        state === "current" ? "text-vio" : state === "past" ? "text-ice/30" : "text-ice/55"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`truncate font-mono text-[11px] font-bold uppercase tracking-[0.08em] ${
                        state === "current" ? "text-ice" : "text-ice/50"
                      }`}
                    >
                      {m.meta.title.replace(/^\d+\s·\s/, "")}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* ── PROGRAM MONITOR + GO ─────────────────────────────────── */}
          <section className="flex min-w-0 flex-col gap-3 p-4">
            <div className="relative">
              <div className="flex items-center justify-between pb-2">
                <span className="flex items-center gap-2 font-mono text-[11px] font-bold tracking-[0.35em] text-ice/45">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-mag" />
                  PROGRAM MONITOR · MUTED — AUDIO LIVES ON STAGE
                </span>
                <span className="font-display text-lg tabular-nums text-ice/60">
                  {String(index + 1).padStart(2, "0")}
                  <span className="text-ice/30"> / {String(deckList.length).padStart(2, "0")}</span>
                </span>
              </div>
              <div className="aspect-video w-full overflow-hidden border-2 border-ice/15 bg-black">
                {current && <DeckPlayer slide={current} dir={dir} />}
              </div>
            </div>

            {/* next up + notes */}
            <div className="grid grid-cols-[1fr_1.2fr] gap-3">
              <div className="border-2 border-ice/10 bg-panel/50 p-3">
                <div className="font-mono text-[10px] font-bold tracking-[0.35em] text-vio">
                  NEXT UP
                </div>
                <div className="mt-1 truncate font-display text-[19px] uppercase tracking-tight text-ice">
                  {next ? next.meta.title.replace(/^\d+\s·\s/, "") : "— END OF SHOW —"}
                </div>
              </div>
              <div className="border-2 border-ice/10 bg-panel/50 p-3">
                <div className="font-mono text-[10px] font-bold tracking-[0.35em] text-ice/40">
                  SPEAKER NOTES
                </div>
                <p className="mt-1 line-clamp-3 font-body text-[13px] leading-snug text-ice/75">
                  {current?.meta.notes ?? "—"}
                </p>
              </div>
            </div>

            {/* GO */}
            <button
              onClick={advance}
              className="group relative mt-auto overflow-hidden border-2 py-6 text-center transition-transform active:scale-[0.99]"
              style={{ borderColor: VIO, background: VIO }}
            >
              <motion.span
                className="absolute inset-y-0 w-1/3 skew-x-[-20deg] bg-white/15"
                animate={{ x: ["-120%", "420%"] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.2 }}
              />
              <span className="relative font-display text-[42px] font-black uppercase leading-none tracking-tight text-ice">
                GO →
              </span>
              <span className="relative mt-1 block font-mono text-[11px] font-bold tracking-[0.4em] text-ice/85">
                SLIDE ACTION FIRST · THEN NEXT CUE · OR PRESS RIGHT ARROW
              </span>
            </button>
          </section>

          {/* ── STATUS COLUMN ─────────────────────────────────────────── */}
          <aside className="flex flex-col gap-3 border-l-2 border-ice/10 p-4">
            {/* lyric now */}
            <div className="border-2 border-ice/10 bg-panel/50 p-3">
              <div className="font-mono text-[10px] font-bold tracking-[0.35em] text-ice/40">
                LYRIC ENGINE
              </div>
              {lyric?.slideId ? (
                <>
                  <div className="mt-1 font-display text-[17px] uppercase tracking-tight text-ice">
                    {lyric.song} <span className="text-ice/40">· {lyric.artist}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 font-mono text-[11px] font-bold tracking-[0.2em]">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: lyric.playing ? VIO : "#9a9494" }}
                    />
                    <span className="text-ice/60">
                      {lyric.manual ? "BAND MODE · WORD BY WORD" : "TRACK MODE"} · LINE{" "}
                      {lyric.line + 1}/{lyric.lines.length}
                    </span>
                  </div>
                </>
              ) : (
                <div className="mt-1 font-body text-[13px] text-ice/40">
                  No lyric slide on stage.
                </div>
              )}
            </div>

            {/* blackout */}
            <button
              onClick={() => dispatch({ type: "toggle", key: "blackout", on: !blackout })}
              className={`border-2 py-4 font-display text-[24px] uppercase tracking-tight transition-colors ${
                blackout ? "bg-mag text-ice" : "border-mag text-mag hover:bg-mag hover:text-ice"
              }`}
              style={{ borderColor: MAG }}
            >
              {blackout ? "■ BLACKOUT" : "BLACKOUT"}
            </button>

            {/* camera quick cut */}
            <div className="border-2 border-ice/10 bg-panel/50 p-3">
              <div className="flex items-center justify-between font-mono text-[10px] font-bold tracking-[0.35em] text-ice/40">
                FLOOR CAMS
                <span className="text-ice/30">{Object.keys(cams).length} LIVE</span>
              </div>
              <div className="mt-2 space-y-1.5">
                {Object.keys(cams).length === 0 && (
                  <p className="font-body text-[12px] text-ice/40">No phones on /camera yet.</p>
                )}
                {Object.entries(cams).map(([id, cam]) => (
                  <button
                    key={id}
                    onClick={() =>
                      dispatch({ type: "cam-active", camId: activeCam === id ? null : id })
                    }
                    className={`flex w-full items-center gap-2 border px-2.5 py-1.5 text-left font-mono text-[11px] font-bold tracking-[0.15em] ${
                      activeCam === id ? "border-volt bg-volt/15 text-ice" : "border-ice/15 text-ice/60 hover:border-volt"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${cam.live ? "animate-pulse bg-volt" : "bg-ice/30"}`}
                    />
                    {cam.name}
                    <span className="ml-auto text-ice/40">{activeCam === id ? "ON AIR" : "CUT"}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* timers */}
            <div className="border-2 border-ice/10 bg-panel/50 p-3">
              <div className="font-mono text-[10px] font-bold tracking-[0.35em] text-ice/40">
                STAGE TIMER
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {[30, 60, 300].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => dispatch({ type: "timer", endsAt: Date.now() + sec * 1000 })}
                    className="border border-ice/20 px-2 py-1 font-mono text-[11px] font-bold text-ice/60 hover:border-volt hover:text-volt"
                  >
                    {sec < 60 ? `0:${String(sec).padStart(2, "0")}` : `${sec / 60}:00`}
                  </button>
                ))}
                <button
                  onClick={() => dispatch({ type: "timer", endsAt: null })}
                  className="border border-ice/20 px-2 py-1 font-mono text-[11px] font-bold text-ice/60 hover:border-mag hover:text-mag"
                >
                  STOP
                </button>
                {timerEndsAt && <TimerChip endsAt={timerEndsAt} />}
              </div>
            </div>

            {/* camera master toggle */}
            <button
              onClick={() => dispatch({ type: "toggle", key: "cameraOn", on: !cameraOn })}
              className={`border-2 py-3 font-mono text-[12px] font-bold tracking-[0.3em] transition-colors ${
                cameraOn ? "border-volt text-volt" : "border-ice/20 text-ice/50 hover:border-volt"
              }`}
            >
              STAGE CAM {cameraOn ? "ON" : "OFF"}
            </button>

            {/* keys legend */}
            <div className="mt-auto border-t-2 border-ice/10 pt-3 font-mono text-[10px] font-bold leading-relaxed tracking-[0.2em] text-ice/35">
              → ADVANCE · SLIDE ACTION FIRST
              <br />
              ← BACK A CUE · B BLACKOUT
              <br />
              THIS CONSOLE IS MUTED. ALWAYS.
            </div>
          </aside>
        </main>
      </MuteProvider>
    </div>
  );
}
