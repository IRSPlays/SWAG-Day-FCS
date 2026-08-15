"use client";

/* /stage — the presentation machine. Fullscreen, zero clutter.
   Keyboard: ←/→/SPACE navigate · ESC or B blackout · C camera ·
   Q QR badge · F fullscreen. Audio commands from the controller
   execute HERE (this machine is patched into the PA). */

import { useEffect, useState } from "react";
import DeckPlayer from "@/engine/DeckPlayer";
import ReactionLayer from "@/components/ReactionLayer";
import QrBadge from "@/components/QrBadge";
import Countdown from "@/components/Countdown";
import CameraWindow from "@/components/CameraWindow";
import { useShow } from "@/store/show";
import { useEffectiveDeck } from "@/store/deckSelect";
import { getTransport } from "@/realtime/transport";
import { audioEngine } from "@/audio/engine";

export default function StagePage() {
  const init = useShow((s) => s.init);
  const dispatch = useShow((s) => s.dispatch);
  const index = useShow((s) => s.index);
  const dir = useShow((s) => s.dir);
  const blackout = useShow((s) => s.blackout);
  const qrOn = useShow((s) => s.qrOn);
  const cameraOn = useShow((s) => s.cameraOn);
  const timerEndsAt = useShow((s) => s.timerEndsAt);
  const deckList = useEffectiveDeck();
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  /* execute audio commands on THIS machine */
  useEffect(() => {
    const t = getTransport();
    return t.subscribe((ev) => {
      if (ev.type === "audio") audioEngine.exec(ev.cmd);
    });
  }, []);

  /* keyboard */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const last = deckList.length - 1;
      if (e.code === "ArrowRight" || e.code === "Space" || e.code === "PageDown") {
        e.preventDefault();
        dispatch({ type: "cue", index: Math.min(last, index + 1), dir: 1 });
      } else if (e.code === "ArrowLeft" || e.code === "PageUp") {
        e.preventDefault();
        dispatch({ type: "cue", index: Math.max(0, index - 1), dir: -1 });
      } else if (e.code === "Escape" || e.code === "KeyB") {
        dispatch({ type: "toggle", key: "blackout", on: !useShow.getState().blackout });
      } else if (e.code === "KeyC") {
        dispatch({ type: "toggle", key: "cameraOn", on: !useShow.getState().cameraOn });
      } else if (e.code === "KeyQ") {
        dispatch({ type: "toggle", key: "qrOn", on: !useShow.getState().qrOn });
      } else if (e.code === "KeyF") {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, deckList.length, dispatch]);

  const current = deckList[Math.max(0, Math.min(index, deckList.length - 1))];
  if (!current) return null;

  return (
    <main className="fixed inset-0 select-none overflow-hidden bg-black">
      <DeckPlayer slide={current} dir={dir} />
      <ReactionLayer />
      {/* always mounted: multi-camera hub keeps every phone connected so the
          controller's cam-active cuts are instant */}
      <CameraWindow />
      {qrOn && !blackout && <QrBadge className="absolute bottom-8 right-8 z-40" />}
      {timerEndsAt && !blackout && (
        <Countdown endsAt={timerEndsAt} className="absolute left-8 top-8 z-40" />
      )}

      {/* emergency blackout — pure black, instant */}
      {blackout && <div className="absolute inset-0 z-[60] bg-black" />}

      {/* one-time arm gesture (autoplay policy) */}
      {!armed && (
        <button
          onClick={() => {
            audioEngine.arm();
            setArmed(true);
          }}
          className="absolute inset-0 z-[70] grid place-items-center bg-court/95"
        >
          <span className="border-4 border-volt px-12 py-8 font-display text-[72px] uppercase tracking-wide text-volt">
            Arm stage ▸ click
          </span>
        </button>
      )}
    </main>
  );
}
