"use client";

/* OutroBgmPlayer — Ambient background music player for end credits & hall dispersal.
   Maintains a global singleton audio instance so playback flows seamlessly
   across Slide 17 (Tribute) and Slide 18 (End Credits) without interruption. */

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useShow } from "@/store/show";

export const BGM_TRACKS = [
  {
    id: "september",
    title: "September",
    artist: "Earth, Wind & Fire",
    src: "/audio/september.flac",
  },
  {
    id: "flashlight",
    title: "Flashlight (Instrumental Karaoke)",
    artist: "Jessie J",
    src: "/audio/flashlight.flac",
  },
  {
    id: "pulang",
    title: "Pulang",
    artist: "Insomniacks",
    src: "/audio/pulang.flac",
  },
  {
    id: "ditto",
    title: "Ditto",
    artist: "NewJeans",
    src: "/audio/ditto.flac",
  },
  {
    id: "everlong",
    title: "Everlong",
    artist: "Foo Fighters",
    src: "/audio/everlong.flac",
  },
];

let globalAudio: HTMLAudioElement | null = null;

function getGlobalAudio(src: string): HTMLAudioElement {
  if (!globalAudio) {
    globalAudio = new Audio(src);
    globalAudio.loop = true;
    globalAudio.preload = "auto";
  } else if (globalAudio.src && !globalAudio.src.endsWith(src)) {
    globalAudio.src = src;
  }
  return globalAudio;
}

export default function OutroBgmPlayer({
  className = "",
  defaultSrc = "/audio/september.flac",
  autoPlay = false,
}: {
  className?: string;
  defaultSrc?: string;
  autoPlay?: boolean;
}) {
  const bgm = useShow((s) => s.bgm);
  const dispatch = useShow((s) => s.dispatch);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = getGlobalAudio(defaultSrc);
    audio.volume = bgm?.volume ?? 0.45;

    const onPlay = () => {
      setPlaying(true);
      dispatch({
        type: "bgm-state",
        playing: true,
        track: bgm?.track ?? "September",
        artist: bgm?.artist ?? "Earth, Wind & Fire",
        volume: audio.volume,
      });
    };

    const onPause = () => {
      setPlaying(false);
      dispatch({
        type: "bgm-state",
        playing: false,
        track: bgm?.track ?? "September",
        artist: bgm?.artist ?? "Earth, Wind & Fire",
        volume: audio.volume,
      });
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    if (autoPlay || bgm?.playing) {
      void audio.play().catch(() => {});
    }

    setPlaying(!audio.paused);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [defaultSrc, autoPlay, dispatch, bgm?.playing, bgm?.volume, bgm?.track, bgm?.artist]);

  const togglePlay = () => {
    const audio = getGlobalAudio(defaultSrc);
    if (audio.paused) {
      void audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  };

  return (
    <div
      className={`flex items-center gap-4 border-2 border-white/15 bg-court/90 px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-md ${className}`}
    >
      {/* play/pause toggle button with animated waveform */}
      <button
        onClick={togglePlay}
        className="grid h-11 w-11 place-items-center border border-volt/40 bg-volt/10 text-volt transition-transform active:scale-95"
      >
        {playing ? (
          <div className="flex items-end gap-0.5 h-4">
            {[0.6, 1, 0.4, 0.8, 0.5].map((h, i) => (
              <motion.span
                key={i}
                className="w-1 bg-volt"
                animate={{ height: ["20%", `${h * 100}%`, "30%"] }}
                transition={{
                  duration: 0.6 + i * 0.1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        ) : (
          <span className="font-mono text-lg font-bold">▶</span>
        )}
      </button>

      <div>
        <div className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-[0.25em] text-volt">
          <span className="h-1.5 w-1.5 rounded-full bg-volt animate-pulse" />
          NOW PLAYING · OUTRO BGM
        </div>
        <div className="mt-0.5 font-body text-[15px] font-extrabold text-ice">
          {bgm?.track ?? "September"}{" "}
          <span className="font-medium text-ice/50">- {bgm?.artist ?? "Earth, Wind & Fire"}</span>
        </div>
      </div>
    </div>
  );
}
