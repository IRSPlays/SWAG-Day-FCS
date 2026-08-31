"use client";

/* 18 · THE BIG THANK YOU — count-of-3 crowd cheer.
    The show's fake-out beat: NJ says we're ending, Razan interrupts with
    the countdown. EVERY press of the right arrow steps it:
    READY? → 3 → 2 → 1 → THANK YOU!!! → next cue. */

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import SlideShell, { CourtLines, LiveBug } from "@/layouts/SlideShell";
import { useSlideContent } from "@/store/show";
import { useSlideAction } from "@/engine/advance";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "cheer-countdown",
  title: "18 · The Big Thank You — 3, 2, 1!",
  transition: "slow-fade-black",
  durationHint: 60,
  notes:
    "Razan: 'WAIT before we end — shout a HUGE thank you on the count of 3! Loudest cheer = no September holiday homework!' PRESS → per step: READY → 3 → 2 → 1 → THANK YOU.",
  accent: "mag",
};

export const content = {
  ready: "READY?",
  count: ["3", "2", "1"],
  final: "THANK YOU!!!",
  sub: "LOUDER = NO SEPTEMBER HOLIDAY HOMEWORK",
};

const STEPS = 5; /* ready + 3 + 2 + 1 + final */

export default function CheerCountdown() {
  const c = useSlideContent(meta.id, content);
  const [step, setStep] = useState(0);

  /* right arrow = next beat; after the final shout, the cue moves on */
  useSlideAction(() => {
    if (step < STEPS - 1) {
      setStep(step + 1);
      return true;
    }
    return false;
  });

  const isFinal = step === STEPS - 1;
  const label = step === 0 ? c.ready : isFinal ? c.final : c.count[step - 1];

  return (
    <SlideShell>
      <CourtLines />

      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between border-b-2 border-ice/10 px-14 py-4">
        <LiveBug label="THE BIG THANK YOU" />
        <span className="font-mono text-[16px] font-bold tracking-[0.4em] text-mag">
          ADMIRALTY · ON MY COUNT
        </span>
      </div>

      {/* radial burst rings behind the number */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={`${label}-${i}`}
            initial={{ scale: 0.2, opacity: 0.35 }}
            animate={{ scale: isFinal ? 2.4 : 1.6 + i * 0.25, opacity: 0 }}
            transition={{ duration: 1.6 + i * 0.3, ease: "easeOut" }}
            className="absolute h-[420px] w-[420px] rounded-full border-2 border-mag"
          />
        ))}
      </div>

      <div className="relative z-10 flex h-full flex-col items-center justify-center pb-16 text-center">
        <motion.div
          key={`${label}-badge`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-2 border-mag/60 bg-mag/10 px-6 py-2 font-mono text-[15px] font-bold tracking-[0.45em] text-mag"
        >
          ON THE COUNT OF 3 — SHOUT IT
        </motion.div>

        <div className="flex h-[46vh] items-center justify-center overflow-hidden">
          <AnimatePresence mode="popLayout" key={label}>
            <motion.div
              initial={{ scale: isFinal ? 0.4 : 2.6, opacity: 0, filter: "blur(18px)" }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
              exit={{ scale: isFinal ? 1.4 : 0.6, opacity: 0, filter: "blur(10px)" }}
              transition={{ type: "spring", stiffness: 210, damping: 20 }}
              className={`font-display uppercase leading-none tracking-tighter ${
                isFinal ? "skew-x-[-5deg] text-mag" : "text-ice"
              }`}
              style={{ fontSize: isFinal ? 200 : 430 }}
            >
              {label}
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.div
          initial={false}
          animate={{ opacity: isFinal ? 1 : 0.55 }}
          className="font-body text-[28px] font-bold tracking-[0.25em] text-ice/80"
        >
          {c.sub}
        </motion.div>
      </div>
    </SlideShell>
  );
}
