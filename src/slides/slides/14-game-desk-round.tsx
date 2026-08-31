"use client";

/* 14 · GUESS WHOSE DESK — round board (kept in the deck ONCE).
    One reusable round: photo left, four options right. The RIGHT ARROW
    reveals the answer (correct option stamps, teacher name drops). Run
    more rounds by live-editing this slide's content from /editor — the
    round badge, photo and options are all editable fields. */

import { useState } from "react";
import { motion } from "motion/react";
import SlideShell, { CourtLines, LiveBug } from "@/layouts/SlideShell";
import { LetterStagger } from "@/animations";
import { useSlideContent } from "@/store/show";
import { useSlideAction } from "@/engine/advance";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "game-desk-round",
  title: "14 · Game Round — Guess Whose Desk",
  transition: "whistle-cut",
  durationHint: 90,
  notes:
    "Edit THIS slide per round from /editor (photo, options, answer, badge). PRESS → to reveal the answer. 3-5 answers max if short on time — one lower sec, one upper sec, one teacher/alumni.",
  accent: "vio",
};

export const content = {
  round: "ROUND 01",
  question: "WHOSE DESK IS THIS?",
  /* desk photo — drop a file in /public and set the path here */
  image: "",
  options: ["MR TAN", "MS LEONG", "MR PHUA", "MDM YAM"],
  answerIndex: 0,
  reveal: "IT'S MR TAN'S DESK!",
};

const LETTERS = ["A", "B", "C", "D"];

export default function GameDeskRound() {
  const c = useSlideContent(meta.id, content);
  const [revealed, setRevealed] = useState(false);

  /* right arrow = reveal; next press moves the show on */
  useSlideAction(() => {
    if (!revealed) {
      setRevealed(true);
      return true;
    }
    return false;
  });

  return (
    <SlideShell>
      <CourtLines />

      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between border-b-2 border-ice/10 px-14 py-4">
        <LiveBug label="GUESS WHOSE DESK" />
        <span className="font-mono text-[16px] font-bold tracking-[0.4em] text-vio">
          {c.round}
        </span>
      </div>

      <div className="relative z-10 grid h-full grid-cols-[1fr_1fr] items-center gap-12 px-16 pb-16 pt-24">
        {/* left: the exhibit */}
        <div>
          <motion.div
            initial={{ rotate: -2, opacity: 0, y: 30 }}
            animate={{ rotate: -1.5, opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative border-4 border-ice/20 bg-panel shadow-2xl"
          >
            {c.image ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={c.image} alt="" className="aspect-[4/3] w-full object-cover" />
            ) : (
              /* placeholder exhibit frame until a photo is set */
              <div className="grid aspect-[4/3] w-full place-items-center border-inset border-dashed border-ice/25">
                <span className="font-mono text-[16px] font-bold tracking-[0.35em] text-ice/40">
                  EXHIBIT A · SET PHOTO VIA /EDITOR
                </span>
              </div>
            )}
            <div className="absolute -bottom-4 left-6 bg-vio px-4 py-1.5 font-mono text-[13px] font-bold tracking-[0.35em] text-ice">
              EXHIBIT · {c.round}
            </div>
          </motion.div>

          <h2 className="mt-10 font-display uppercase leading-[0.9] tracking-tight text-ice">
            <LetterStagger text={c.question} delay={0.4} className="text-[64px]" />
          </h2>
        </div>

        {/* right: the four suspects */}
        <div className="flex flex-col gap-4">
          {c.options.map((opt, i) => {
            const isAnswer = i === c.answerIndex;
            const stamp = revealed && isAnswer;
            return (
              <motion.div
                key={`${opt}-${i}`}
                initial={{ x: 60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.35 + i * 0.14, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className={`flex items-center gap-5 border-2 px-7 py-5 transition-colors ${
                  stamp
                    ? "border-vio bg-vio text-ice"
                    : revealed && !isAnswer
                      ? "border-ice/10 bg-panel/60 text-ice/30"
                      : "border-ice/20 bg-panel/80 text-ice"
                }`}
              >
                <span
                  className={`grid h-14 w-14 shrink-0 place-items-center border-2 font-display text-[30px] font-black ${
                    stamp ? "border-ice/60" : "border-ice/25 text-vio"
                  }`}
                >
                  {LETTERS[i]}
                </span>
                <span className="font-display text-[44px] font-black uppercase tracking-tight">
                  {opt}
                </span>
                {stamp && (
                  <motion.span
                    initial={{ scale: 0, rotate: -14 }}
                    animate={{ scale: 1, rotate: -8 }}
                    transition={{ type: "spring", stiffness: 320, damping: 16, delay: 0.1 }}
                    className="ml-auto border-4 border-ice px-4 py-1 font-mono text-[15px] font-bold tracking-[0.3em]"
                  >
                    DESK!
                  </motion.span>
                )}
              </motion.div>
            );
          })}

          <motion.div
            initial={false}
            animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.4, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="mt-2 font-serifit text-[46px] italic text-vio"
          >
            {revealed ? c.reveal : "right arrow reveals the answer"}
          </motion.div>
        </div>
      </div>
    </SlideShell>
  );
}
