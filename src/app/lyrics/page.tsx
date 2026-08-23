"use client";

/* /lyrics - the LYRIC OPERATOR CONSOLE (manual mode).
   Run this on a phone/tablet (the person running lyrics). It mirrors the
   lyric slide currently on stage and sends commands: tap NEXT the moment
   the singer reaches the next line - the stage reacts instantly.
   Works for both drive modes:
   - TRACK mode: play/pause/skip jumps the audio, lyrics follow the track
   - MANUAL mode (live band): NEXT/PREV tap the lines along directly */

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { useShow } from "@/store/show";

export default function LyricsConsole() {
  const init = useShow((s) => s.init);
  const dispatch = useShow((s) => s.dispatch);
  const lyric = useShow((s) => s.lyric);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { init(); }, [init]);

  /* keep the current line in view */
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>("[data-active=\"1\"]");
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [lyric?.line]);

  const cmd = (action: "play" | "pause" | "next" | "prev" | "restart" | "goto", line?: number) =>
    lyric && dispatch({ type: "lyric-cmd", slideId: lyric.slideId, action, line });

  const playing = lyric?.playing ?? false;

  /* hardware volume buttons etc. are avoided; big thumb-friendly targets */
  return (
    <main className="min-h-screen bg-[#07050f] text-ice">
      {/* header */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-[#07050f]/95 px-5 pb-3 pt-5 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold tracking-[0.35em] text-[#8f6bff]">LYRIC CONSOLE</div>
            <div className="mt-0.5 text-xl font-extrabold">
              {lyric ? lyric.song : "NO LYRIC SLIDE ON STAGE"}
              {lyric?.artist && <span className="text-ice/40"> - {lyric.artist}</span>}
            </div>
          </div>
          {lyric && (
            <div className="text-right">
              <span className={`inline-block rounded-full border px-3 py-1 text-[11px] font-bold tracking-[0.2em] ${
                lyric.manual ? "border-[#ff3da655] text-[#ff3da6]" : "border-[#23dcff55] text-[#23dcff]"
              }`}>
                {lyric.manual ? "MANUAL" : "TRACK"}
              </span>
              <div className="mt-1 text-[11px] font-bold tracking-[0.2em] text-ice/50">
                {lyric.section || "-"}
              </div>
            </div>
          )}
        </div>
        {!lyric && (
          <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-ice/60">
            Cue the lyric slide on stage first (controller or arrow keys), then this console wakes up automatically.
          </div>
        )}
      </div>

      {lyric && (
        <>
          {/* current + next line - big and glanceable */}
          <div className="px-5 pb-4 pt-5">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold tracking-[0.3em] text-ice/40">ON STAGE NOW</div>
              <div className="font-mono text-[12px] text-ice/50 tabular-nums">
                {lyric.line >= 0 ? `LINE ${lyric.line + 1} / ${lyric.lines.length}` : "INTRO CARD"}
              </div>
            </div>
            <motion.div
              key={lyric.line}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 min-h-[64px] rounded-xl border border-white/10 bg-white/[0.04] p-4 text-[24px] font-extrabold leading-tight text-volt"
            >
              {lyric.line >= 0 ? lyric.lines[lyric.line] : "(Intro Screen — Title & Performer Credits)"}
            </motion.div>

            {/* upcoming lyric queue (accessible exclusively to operator) */}
            <div className="mt-4">
              <div className="text-[11px] font-bold tracking-[0.3em] text-ice/40">NEXT UP (OPERATOR QUEUE)</div>
              <div className="mt-1.5 flex flex-col gap-1.5">
                {lyric.line + 1 < lyric.lines.length ? (
                  <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3.5 py-2 text-[16px] font-semibold text-ice/85">
                    <span className="mr-2 font-mono text-[11px] text-ice/40">NEXT:</span>
                    {lyric.lines[lyric.line + 1]}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-white/10 px-3.5 py-2 text-[14px] text-ice/40">
                    (End of lyrics — next tap returns to Title Screen)
                  </div>
                )}
                {lyric.line + 2 < lyric.lines.length && (
                  <div className="px-3.5 py-1 text-[13px] text-ice/40">
                    <span className="mr-2 font-mono text-[10px] text-ice/30">THEN:</span>
                    {lyric.lines[lyric.line + 2]}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* transport - huge thumb targets */}
          <div className="sticky bottom-0 z-20 border-t border-white/10 bg-[#07050f]/95 px-4 pb-6 pt-3 backdrop-blur">
            <div className="flex items-center gap-3">
              <button
                onClick={() => cmd("prev")}
                className="h-16 flex-1 rounded-2xl border border-white/15 bg-white/[0.04] text-xl font-extrabold active:scale-95"
              >
                &larr; PREV
              </button>
              <button
                onClick={() => cmd(playing ? "pause" : "play")}
                className={`h-16 w-24 rounded-2xl text-xl font-extrabold active:scale-95 ${
                  playing ? "bg-[#ff3da6] text-black" : "bg-[#23dcff] text-black"
                }`}
              >
                {playing ? "PAUSE" : "PLAY"}
              </button>
              <button
                onClick={() => cmd("next")}
                className="h-16 flex-[2] rounded-2xl bg-[#8f6bff] text-2xl font-black tracking-wide text-black active:scale-95"
              >
                NEXT &darr;
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => cmd("goto", -1)}
                className={`h-11 flex-1 rounded-xl border text-xs font-bold tracking-[0.2em] active:scale-95 ${
                  lyric.line < 0
                    ? "border-volt bg-volt/20 text-volt"
                    : "border-white/10 text-ice/60 hover:border-white/20"
                }`}
              >
                TITLE CARD (INTRO)
              </button>
              <button
                onClick={() => cmd("restart")}
                className="h-11 flex-1 rounded-xl border border-white/10 text-xs font-bold tracking-[0.2em] text-ice/60 hover:border-white/20 active:scale-95"
              >
                RESTART TRACK
              </button>
            </div>
          </div>

          {/* full song list - tap any line to jump */}
          <div ref={listRef} className="max-h-[52vh] overflow-y-auto px-5 pb-6">
            <div className="mb-2 text-[11px] font-bold tracking-[0.3em] text-ice/40">JUMP TO LINE</div>
            {lyric.lines.map((t, i) => (
              <button
                key={i}
                data-active={i === lyric.line ? "1" : "0"}
                onClick={() => cmd("goto", i)}
                className={`mb-1 block w-full rounded-lg px-4 py-2.5 text-left text-[15px] leading-snug ${
                  i === lyric.line
                    ? "bg-[#8f6bff]/20 font-extrabold text-ice"
                    : i < lyric.line
                      ? "text-ice/25"
                      : "text-ice/55"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </>
      )}
    </main>
  );
}