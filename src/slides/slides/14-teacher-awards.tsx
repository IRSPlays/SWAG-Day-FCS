"use client";

/* 05 · CARING TEACHER AWARDS — recipient roll call.
    Award-show stage with a living roll: EVERY press of the right arrow
    reveals the next recipient. The stage announces, the screen follows.
    When all five are up, the next unclaimed advance moves the show on. */

import { useState } from "react";
import { motion } from "motion/react";
import SlideShell, { CourtLines, LiveBug, TickerBand } from "@/layouts/SlideShell";
import { LetterStagger, ClipWipeReveal } from "@/animations";
import { useSlideContent } from "@/store/show";
import { useSlideAction } from "@/engine/advance";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "awards-cta",
  title: "05 · Caring Teacher Awards",
  transition: "whistle-cut",
  durationHint: 300,
  notes:
    "NJ introduces the CTA; Mr Kelly Tan presents. PRESS → to reveal each recipient as they are announced: Achmad Nasrun → Leong Mun Yi → Sebastian Poh → Sharifah Nur Hidayah → Tan Han Yu Melvin.",
  accent: "mag",
};

export const content = {
  kicker: "CARING TEACHER AWARD · PRESENTED BY MR KELLY TAN",
  titleTop: "CARING",
  titleBottom: "TEACHER",
  serif: "for care and passion in every lesson taught.",
  recipients: [
    "Mr Achmad Nasrun Bin Abdul Khakam",
    "Ms Leong Mun Yi",
    "Mr Sebastian Poh Yi Jie",
    "Mdm Sharifah Nur Hidayah Binte Omar Albar",
    "Mr Tan Han Yu Melvin",
  ],
  ticker: [
    "CARING TEACHER AWARDS",
    "CONGRATULATIONS",
    "GIVE IT UP FOR OUR TEACHERS",
    "SWAG DAY '26",
  ],
};

const GOLD = "#e1811f";

export default function AwardsCta() {
  const c = useSlideContent(meta.id, content);
  const [shown, setShown] = useState(0);

  /* right arrow = next recipient; once all are up, the cue moves on */
  useSlideAction(() => {
    if (shown < c.recipients.length) {
      setShown(shown + 1);
      return true;
    }
    return false;
  });

  return (
    <SlideShell>
      <CourtLines />

      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between border-b-2 border-ice/10 px-14 py-4">
        <LiveBug label="AWARDS LIVE" />
        <span className="font-mono text-[16px] font-bold tracking-[0.4em]" style={{ color: GOLD }}>
          {shown}/{c.recipients.length} ANNOUNCED
        </span>
      </div>

      {/* spotlight cones */}
      <motion.div
        animate={{ opacity: [0.12, 0.35, 0.12] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -top-32 left-1/2 z-0 h-[130%] w-[900px] -translate-x-1/2"
        style={{
          background: `linear-gradient(to bottom, ${GOLD}38, transparent 65%)`,
          clipPath: "polygon(38% 0, 62% 0, 100% 100%, 0 100%)",
          filter: "blur(10px)",
        }}
      />

      <div className="relative z-10 grid h-full grid-cols-[1fr_1.25fr] items-center gap-12 px-16 pb-20 pt-24">
        {/* left: the award */}
        <div>
          <ClipWipeReveal delay={0.1} from="top">
            <span
              className="inline-block border-2 px-5 py-2 font-mono text-[13px] font-bold tracking-[0.35em]"
              style={{ borderColor: `${GOLD}88`, color: GOLD }}
            >
              {c.kicker}
            </span>
          </ClipWipeReveal>
          <h1 className="mt-6 font-display uppercase leading-[0.84] tracking-tighter">
            <LetterStagger text={c.titleTop} delay={0.3} className="block text-[128px] text-ice" />
            <div className="block skew-x-[-6deg] text-[128px]" style={{ color: GOLD }}>
              <LetterStagger text={c.titleBottom} delay={0.55} skewX={-6} />
            </div>
          </h1>
          <ClipWipeReveal delay={0.75}>
            <p className="mt-6 max-w-[440px] font-serifit text-[38px] italic leading-tight text-ice/80">
              {c.serif}
            </p>
          </ClipWipeReveal>
        </div>

        {/* right: the living roll call */}
        <div className="flex flex-col gap-3">
          {c.recipients.map((name, i) => {
            const shownYet = i < shown;
            return (
              <motion.div
                key={name}
                initial={false}
                animate={
                  shownYet
                    ? { opacity: 1, x: 0, filter: "blur(0px)" }
                    : { opacity: 0, x: 60, filter: "blur(8px)" }
                }
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className={`flex items-center gap-5 border-l-8 bg-panel/80 py-4 pl-6 pr-8 ${
                  i === shown - 1 ? "border-mag shadow-2xl" : "border-volt/40"
                }`}
                style={{ borderColor: i === shown - 1 ? GOLD : undefined }}
              >
                <span
                  className="font-display text-[30px] font-black tabular-nums"
                  style={{ color: i === shown - 1 ? GOLD : `${GOLD}77` }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div className="font-body text-[30px] font-bold leading-tight tracking-[0.02em] text-ice">
                    {name}
                  </div>
                  {i === shown - 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="mt-0.5 font-mono text-[12px] font-bold tracking-[0.4em]"
                      style={{ color: GOLD }}
                    >
                      COME ON UP
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-30">
        <TickerBand items={c.ticker} />
      </div>
    </SlideShell>
  );
}
