"use client";

/* MovieCredits — Cinematic vertical scrolling movie end credits engine.
   Hollywood-style typographic layout with automatic crawl & seamless loop rewind. */

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

export interface CreditSection {
  title: string;
  names: string[];
  role?: string;
  columns?: boolean;
}

export const DEFAULT_CREDITS: CreditSection[] = [
  {
    title: "STAGE PRODUCTION & SYSTEM ARCHITECT",
    names: ["Haziq"],
    role: "Full-Stack System Engineering, Realtime Transport & Stage Direction",
  },
  {
    title: "GAME MASTERS & TOURNAMENT HOSTS",
    names: ["Haziq", "Tournament Host 2", "Tournament Host 3"],
    role: "Mic Direction & Arena Crowd Control",
  },
  {
    title: "FLOOR BROADCAST CAMERA CREW",
    names: ["Floor Cameraman 01", "Floor Cameraman 02"],
    role: "Live Multi-Camera WebRTC Mobile Streaming",
  },
  {
    title: "STAGE CONTROLLER & AUDIO DIRECTORS",
    names: ["Tech Director", "Sound Engineer"],
    role: "Audio Engine, Soundboard FX & Live Camera Switching",
  },
  {
    title: "MASTERS OF CEREMONIES",
    names: ["Lead MC 01", "Lead MC 02"],
  },
  {
    title: "FEATURED MUSICAL PERFORMERS",
    names: [
      "Haziq (Piano)",
      "Daniel (Vocals)",
      "Syazwan (Vocals)",
      "Anaqi (Vocals)",
      "Student Rock Band",
      "Vocal Ensemble & Acoustic Duet",
    ],
    columns: true,
  },
  {
    title: "PARENT SUPPORT GROUP (PSG)",
    names: ["Teachers' Day '26 PSG Dance Squad"],
    role: "Surprise Dance Performance",
  },
  {
    title: "COHORT TEACHER CHAMPIONS",
    names: [
      "Sec 1 Titans Teacher Rep",
      "Sec 2 Cyclones Teacher Rep",
      "Sec 3 Vipers Teacher Rep",
      "Sec 4 & Staff Apex Teacher Rep",
    ],
    columns: true,
  },
  {
    title: "SPECIAL THANKS",
    names: [
      "School Leadership & Principal",
      "All Teachers, Coaches & Support Staff",
      "Student Council & AV Crew",
      "The Entire Student Body of 2026",
    ],
    columns: true,
  },
];

export default function MovieCredits({
  speed = 38, // pixels per second
  credits = DEFAULT_CREDITS,
}: {
  speed?: number;
  credits?: CreditSection[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let raf = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (!isPaused && contentRef.current && containerRef.current) {
        const contentHeight = contentRef.current.offsetHeight;
        const containerHeight = containerRef.current.offsetHeight;
        const maxScroll = contentHeight + containerHeight * 0.4;

        setScrollY((prev) => {
          const next = prev + speed * dt;
          if (next >= maxScroll) {
            /* seamless loop rewind to top */
            return -containerHeight * 0.6;
          }
          return next;
        });
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speed, isPaused]);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative h-full w-full overflow-hidden select-none"
    >
      {/* top and bottom cinematic gradient vignettes */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-44 bg-gradient-to-b from-[#05040c] via-[#05040c]/80 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-44 bg-gradient-to-t from-[#05040c] via-[#05040c]/80 to-transparent" />

      {/* scrolling credit roll container */}
      <div
        ref={contentRef}
        style={{
          transform: `translate3d(0, ${-scrollY}px, 0)`,
          willChange: "transform",
        }}
        className="mx-auto flex max-w-[1280px] flex-col items-center gap-20 py-24 text-center"
      >
        {/* head title banner */}
        <div className="flex flex-col items-center">
          <div className="font-mono text-[14px] font-bold tracking-[0.5em] text-mag">
            SWAG DAY &apos;26 PRODUCTION
          </div>
          <h1 className="mt-3 font-display text-[84px] uppercase tracking-wide text-ice">
            CREDITS &amp; SALUTE
          </h1>
          <div className="mt-4 h-1 w-32 bg-volt" />
          <p className="mt-4 font-serifit text-[28px] italic text-ice/60">
            suit up · show up · sport it up
          </p>
        </div>

        {/* credit sections */}
        {credits.map((sec, idx) => (
          <div key={idx} className="flex w-full flex-col items-center">
            {/* role / department header */}
            <h2 className="font-mono text-[16px] font-bold tracking-[0.45em] text-volt uppercase">
              {sec.title}
            </h2>

            {sec.role && (
              <p className="mt-2 font-mono text-[13px] tracking-[0.2em] text-ice/50">
                {sec.role}
              </p>
            )}

            {/* names */}
            {sec.columns ? (
              <div className="mt-6 grid w-full grid-cols-2 gap-x-12 gap-y-3">
                {sec.names.map((name, i) => (
                  <div
                    key={i}
                    className="font-body text-[26px] font-bold tracking-wide text-ice/90"
                  >
                    {name}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 flex flex-col gap-3">
                {sec.names.map((name, i) => (
                  <div
                    key={i}
                    className="font-body text-[32px] font-black tracking-wide text-ice"
                  >
                    {name}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-14 h-px w-24 bg-white/10" />
          </div>
        ))}

        {/* concluding logo emblem */}
        <div className="pt-12 pb-24 flex flex-col items-center">
          <div className="font-display text-[96px] uppercase tracking-wider text-volt leading-none">
            SWAG DAY <span className="text-mag">FS</span>
          </div>
          <div className="mt-3 font-mono text-[13px] tracking-[0.4em] text-ice/40">
            TEACHERS&apos; DAY &apos;26 · ALL RIGHTS RESERVED
          </div>
        </div>
      </div>
    </div>
  );
}
