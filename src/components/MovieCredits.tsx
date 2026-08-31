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
    title: "MASTERS OF CEREMONIES",
    names: ["NJ", "Razan"],
  },
  {
    title: "MAIN IC & GAME MASTERS",
    names: ["Haziq", "Aqil", "Jeffrey"],
    role: "Guess Whose Desk · Arena Crowd Control",
  },
  {
    title: "BACKSTAGE ICS",
    names: ["Lovelle", "Joel"],
    role: "Ushering · Time Management · Performer Management",
  },
  {
    title: "SLIDES & MUSIC OPERATORS",
    names: ["Alisya", "Kai Qing"],
    role: "The Start Tree · Show Control · Lyric Console",
  },
  {
    title: "ON-GROUND CREW",
    names: ["Jeffery — Gifts", "Rianne — Ushering Mr Tan", "Nuzhah & Zhun Keat — Alumni Flow"],
  },
  {
    title: "FEATURED PERFORMANCES",
    names: [
      "Lunar6tactics — Still Into You",
      "Raien — Ditto",
      "Kylie — Flashlight",
      "Airis & Serena — Untuk Dia",
      "Xiang Rui — Solo",
      "Rayyan Group — Everlong",
      "Haziq & Syazwan — Pulang",
    ],
    columns: true,
  },
  {
    title: "PARENT SUPPORT GROUP (PSG)",
    names: ["Teachers' Day '26 PSG Dance Squad"],
    role: "Surprise Dance Performance",
  },
  {
    title: "SPECIAL THANKS",
    names: [
      "Mr Kelly Tan — Address & Award Presentation",
      "School Leadership & Principal",
      "All Teachers, Coaches & Support Staff",
      "Student Council & LHP Crew",
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
  useEffect(() => {
    let raf = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (contentRef.current && containerRef.current) {
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
  }, [speed]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden select-none"
    >
      {/* edge fades in the page colour so names dissolve softly at the
          frame's top and bottom — never dark bands on the white stage */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-44 bg-gradient-to-b from-white via-white/85 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-44 bg-gradient-to-t from-white via-white/85 to-transparent" />

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
