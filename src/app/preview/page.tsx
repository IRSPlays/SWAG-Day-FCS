"use client";

/* ============================================================
   /preview — the motion sandbox.
   Reference deck running with the full mograph system.
   Keyboard: ← → / SPACE navigate · A autoplay · F fullscreen
   ============================================================ */

import { useCallback, useEffect, useState } from "react";
import DeckPlayer from "@/engine/DeckPlayer";
import { deck, eventTitle } from "@/slides/deck";
import { getTransition } from "@/transitions";
import type { SlideDirection } from "@/transitions";

export default function PreviewPage() {
  const [state, setState] = useState<{ index: number; dir: SlideDirection }>({
    index: 0,
    dir: 1,
  });
  const [autoplay, setAutoplay] = useState(false);

  const current = deck[state.index];
  const t = getTransition(current.meta.transition);

  const go = useCallback((target: number) => {
    setState((s) => {
      const clamped = Math.max(0, Math.min(deck.length - 1, target));
      if (clamped === s.index) return s;
      return { index: clamped, dir: clamped > s.index ? 1 : -1 };
    });
  }, []);

  const next = useCallback(() => {
    setState((s) =>
      s.index < deck.length - 1 ? { index: s.index + 1, dir: 1 } : s
    );
  }, []);

  const prev = useCallback(() => {
    setState((s) =>
      s.index > 0 ? { index: s.index - 1, dir: -1 } : s
    );
  }, []);

  /* keyboard navigation */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "ArrowRight" || e.code === "Space" || e.code === "PageDown") {
        e.preventDefault();
        next();
      } else if (e.code === "ArrowLeft" || e.code === "PageUp") {
        e.preventDefault();
        prev();
      } else if (e.code === "Home") {
        go(0);
      } else if (e.code === "End") {
        go(deck.length - 1);
      } else if (e.code === "KeyA") {
        setAutoplay((a) => !a);
      } else if (e.code === "KeyF") {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, go]);

  /* autoplay loop */
  useEffect(() => {
    if (!autoplay) return;
    const id = setInterval(() => {
      setState((s) => ({ index: (s.index + 1) % deck.length, dir: 1 }));
    }, 6500);
    return () => clearInterval(id);
  }, [autoplay]);

  return (
    <div className="page-light flex h-screen select-none flex-col bg-white text-ice">
      {/* header */}
      <header className="flex items-center justify-between border-b border-ice/10 px-6 py-3">
        <div className="flex items-baseline gap-4">
          <span className="font-display text-2xl uppercase tracking-wide">SWAG DAY FS</span>
          <span className="font-serifit text-lg italic text-ice/50">preview sandbox</span>
        </div>
        <div className="flex items-center gap-6 font-body text-sm font-medium tracking-[0.25em] text-ice/60">
          <span className="hidden md:inline">{eventTitle}</span>
          <span>
            {current.meta.title.toUpperCase()}
          </span>
          <span className="text-volt">
            {String(state.index + 1).padStart(2, "0")} / {String(deck.length).padStart(2, "0")}
          </span>
        </div>
      </header>

      {/* stage */}
      <main className="min-h-0 flex-1 p-5">
        <div className="h-full w-full overflow-hidden border border-ice/15 bg-court shadow-[0_30px_90px_rgba(0,0,0,0.65)]">
          <DeckPlayer slide={deck[state.index]} dir={state.dir} />
        </div>
      </main>

      {/* control bar */}
      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-ice/10 px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={prev}
            className="border-2 border-ice/20 px-4 py-2 font-body text-sm font-bold tracking-[0.2em] text-ice/80 transition-colors hover:border-volt hover:text-volt"
          >
            ← PREV
          </button>
          <button
            onClick={next}
            className="border-2 border-volt bg-volt px-4 py-2 font-body text-sm font-bold tracking-[0.2em] text-court transition-colors hover:bg-ice hover:border-ice"
          >
            NEXT →
          </button>
          <button
            onClick={() => setAutoplay((a) => !a)}
            className={`border-2 px-4 py-2 font-body text-sm font-bold tracking-[0.2em] transition-colors ${
              autoplay
                ? "border-mag bg-mag text-ice"
                : "border-ice/20 text-ice/80 hover:border-mag hover:text-mag"
            }`}
          >
            {autoplay ? "■ AUTOPLAY ON" : "▶ AUTOPLAY"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {deck.map((s, i) => (
            <button
              key={s.meta.id}
              onClick={() => go(i)}
              title={s.meta.title}
              aria-label={s.meta.title}
              className={`h-2.5 transition-all duration-300 ${
                i === state.index
                  ? "w-10 bg-volt"
                  : "w-2.5 bg-ice/25 hover:bg-ice/60"
              }`}
            />
          ))}
        </div>

        <div className="font-body text-xs font-medium tracking-[0.2em] text-ice/45">
          TRANSITION: <span className="text-vio">{t.label.toUpperCase()}</span> · ←/→ SPACE · A
          AUTOPLAY · F FULLSCREEN
        </div>
      </footer>
    </div>
  );
}
