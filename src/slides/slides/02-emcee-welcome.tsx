"use client";

/* 02 · GRAND OPENING — "WHAT IS UP, ADMIRALTY!"
   Emcee intro splash: giant shouted lines, mic-drop energy, theme banner.
   Unique layout: full-bleed centre shout stack + bottom dual-emcee bar. */

import { motion } from "motion/react";
import SlideShell, { CourtLines, LiveBug } from "@/layouts/SlideShell";
import { LetterStagger } from "@/animations";
import { useSlideContent } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "emcee-welcome",
  title: "02 · Emcee Welcome — Najwa & Rayyan",
  transition: "baton-change",
  durationHint: 14,
  notes:
    "Najwa: 'WHAT IS UP, ADMIRALTY! Welcome to SWAG DAY 2026!' Rayyan: 'I can't hear you! I said, ARE YOU READY? Today we Suit Up, Show Up and Sport it Up! We are your hosts, Najwa and Rayyan!'",
  accent: "mag",
};

export const content = {
  shout1: "WHAT IS UP,",
  shout2: "ADMIRALTY!",
  shout3: "ARE YOU READY?",
  themeLine: "SUIT UP! SHOW UP! SPORT IT UP!",
  yearBadge: "SWAG DAY 2026",
  emcees: [
    { name: "NAJWA", role: "YOUR HOST" },
    { name: "RAYYAN", role: "YOUR HOST" },
  ],
};

export default function EmceeWelcome() {
  const c = useSlideContent(meta.id, content);

  return (
    <SlideShell className="bg-[#08030d]">
      <CourtLines />

      {/* top live bug row */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between border-b-2 border-ice/10 px-14 py-4">
        <LiveBug label="GRAND OPENING" />
        <span className="font-mono text-[16px] font-bold tracking-[0.4em] text-volt">
          {c.yearBadge}
        </span>
      </div>

      {/* rotated megaphone rays behind the shout */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden opacity-[0.55]">
        <motion.div
          animate={{ rotate: [0, 2, -2, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="h-[160%] w-[130%]"
          style={{
            background:
              "conic-gradient(from 180deg at 50% 42%, transparent 0deg, rgba(255,61,166,0.12) 12deg, transparent 24deg, rgba(35,220,255,0.10) 38deg, transparent 50deg, rgba(255,210,63,0.08) 66deg, transparent 78deg)",
          }}
        />
      </div>

      {/* centre shout stack */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center pb-24 text-center">
        <motion.h1
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="font-display uppercase leading-[0.84] tracking-tighter"
        >
          <LetterStagger text={c.shout1} delay={0.25} className="block text-[124px] text-ice" />
          <LetterStagger
            text={c.shout2}
            delay={0.5}
            className="block skew-x-[-6deg] text-[190px] text-mag"
          />
        </motion.h1>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.9, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 h-2 w-[560px] origin-center bg-gradient-to-r from-transparent via-volt to-transparent"
        />

        <motion.p
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.05, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-7 font-display text-[96px] font-black uppercase leading-none tracking-tight text-volt"
        >
          {c.shout3}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, letterSpacing: "0.9em" }}
          animate={{ opacity: 1, letterSpacing: "0.45em" }}
          transition={{ delay: 1.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 border-2 border-mag/60 bg-mag/10 px-8 py-3 font-body text-[26px] font-bold uppercase text-mag backdrop-blur-md"
        >
          {c.themeLine}
        </motion.div>
      </div>

      {/* bottom dual-emcee bar — unique to this slide */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center gap-6 border-t-2 border-ice/10 bg-court/85 py-5 backdrop-blur-md">
        {c.emcees.map((m, i) => (
          <motion.div
            key={m.name}
            initial={{ y: 46, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.5 + i * 0.18, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="flex min-w-[420px] items-center gap-5 border-l-8 px-8 py-2"
            style={{ borderColor: i === 0 ? "#ff3da6" : "#23dcff" }}
          >
            <span className="text-[42px] leading-none">{i === 0 ? "🎤" : "🎙️"}</span>
            <div>
              <div className="font-display text-[38px] font-black uppercase leading-none text-ice">
                {m.name}
              </div>
              <div className="mt-1 font-mono text-[13px] font-bold tracking-[0.35em] text-ice/55">
                {m.role}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}
