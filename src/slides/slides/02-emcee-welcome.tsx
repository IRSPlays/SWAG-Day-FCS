"use client";

/* 02 · GRAND OPENING — "WHAT IS UP, ADMIRALTY!"
   Emcee intro splash: giant shouted lines, mic-drop energy, theme banner.
   Unique layout: full-bleed centre shout stack + bottom dual-emcee bar.
   Script beat: Razan credits the SWAG Day appreciation cards —
   "made by Lovelle Tew from Aquila 5" — card shown beside the shout. */

import { motion } from "motion/react";
import SlideShell, { CourtLines, LiveBug } from "@/layouts/SlideShell";
import { LetterStagger } from "@/animations";
import { useSlideContent } from "@/store/show";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "emcee-welcome",
  title: "02 · Emcee Welcome — NJ & Razan",
  transition: "baton-change",
  durationHint: 14,
  notes:
    "NJ: 'WHAT IS UP, ADMIRALTY! Welcome to SWAG DAY 2026!' Razan: 'ARE YOU READY? We are your hosts, NJ and Razan, and we are going to make this the most legendary SWAG Day ever!' NJ: 'Today is about celebrating our teachers and staff.' Razan: 'Hope all of you have been Spreading Warmth and Gratitude to all staff — especially using the SWAG Day appreciation cards made by Lovelle Tew from Aquila 5!' (card on screen) NJ: 'This year's theme is all about sports — Suit Up, Show Up, Sport it Up!'",
  accent: "mag",
};

export const content = {
  shout1: "WHAT IS UP,",
  shout2: "ADMIRALTY!",
  shout3: "ARE YOU READY?",
  themeLine: "SUIT UP! SHOW UP! SPORT IT UP!",
  yearBadge: "SWAG DAY 2026",
  cardImage: "/SWAG-Day-Card.jpg",
  cardKicker: "SPREAD WARMTH & GRATITUDE",
  cardCredit: "APPRECIATION CARDS DESIGNED BY LOVELLE TEW YU SI · AQUILA 5",
  emcees: [
    { name: "NJ", role: "YOUR HOST" },
    { name: "RAZAN", role: "YOUR HOST" },
  ],
};

export default function EmceeWelcome() {
  const c = useSlideContent(meta.id, content);

  return (
    <SlideShell>
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
              "conic-gradient(from 180deg at 50% 42%, transparent 0deg, rgba(234,58,58,0.12) 12deg, transparent 24deg, rgba(71,88,214,0.10) 38deg, transparent 50deg, rgba(225,129,31,0.08) 66deg, transparent 78deg)",
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

      {/* the appreciation card — script credit: Lovelle Tew Yu Si (Aquila 5) */}
      <motion.div
        initial={{ x: 120, opacity: 0, rotate: 10 }}
        animate={{ x: 0, opacity: 1, rotate: 4 }}
        transition={{ delay: 1.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute right-14 top-[16%] z-20 w-[340px]"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="border-2 border-ice/15 bg-panel/90 p-3 shadow-2xl backdrop-blur-md"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={c.cardImage}
            alt="SWAG Day 2026 appreciation card"
            className="aspect-[4/3] w-full object-cover"
            draggable={false}
          />
          <div className="px-1 pb-1 pt-3 text-left">
            <div className="font-mono text-[12px] font-bold tracking-[0.3em] text-vio">
              {c.cardKicker}
            </div>
            <div className="mt-1.5 font-mono text-[13px] font-bold leading-relaxed tracking-[0.12em] text-ice/75">
              {c.cardCredit}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* bottom dual-emcee bar — unique to this slide */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center gap-6 border-t-2 border-ice/10 bg-court/85 py-5 backdrop-blur-md">
        {c.emcees.map((m, i) => (
          <motion.div
            key={m.name}
            initial={{ y: 46, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.5 + i * 0.18, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="flex min-w-[420px] items-center gap-5 border-l-8 px-8 py-2"
            style={{ borderColor: i === 0 ? "#ea3a3a" : "#4758d6" }}
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
