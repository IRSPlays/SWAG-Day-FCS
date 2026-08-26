"use client";

/* 09 · TOURNAMENT INTRO — The Cohort Clash Kickoff.
   High-impact concert tournament faceoff screen with stadium pass aesthetic. */

import { motion } from "motion/react";
import SlideShell, { CourtLines, LiveBug, TickerBand } from "@/layouts/SlideShell";
import { LetterStagger, ClipWipeReveal } from "@/animations";
import { useSlideContent, useShow } from "@/store/show";
import { QRCodeSVG } from "qrcode.react";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "tournament-intro",
  title: "09 · Tournament Kickoff — Cohort Clash",
  transition: "split-flap-reset",
  durationHint: 20,
  notes:
    "Game Master takes the mic! Announce the Google Form teacher picks. Audience scans to react!",
  accent: "volt",
};

export const content = {
  kicker: "EVENT 01 & 02 · ARENA TOURNAMENT",
  titleTop: "COHORT",
  titleBottom: "CLASH",
  serif: "Teachers take the court. Cohorts bring the noise.",
  rules: [
    { n: "01", title: "2 GAUNTLET GAMES", tag: "INFLATABLE RELAY · BALL BALANCE" },
    { n: "02", title: "SPEED & AGILITY", tag: "+3 PTS 1ST · +2 PTS 2ND · +1 PT 3RD" },
    { n: "03", title: "AUDIENCE LIVE VOTE", tag: "SCAN TO VOTE MVP & SEND REACTIONS" },
  ],
  ticker: [
    "COHORT CLASH HAS BEGUN",
    "SEC 1 TITANS",
    "SEC 2 CYCLONES",
    "SEC 3 VIPERS",
    "SEC 4 APEX",
    "CHEER LOUD FOR YOUR TEACHERS",
    "LIVE FLOOR ACTION",
  ],
};

export default function TournamentIntro() {
  const c = useSlideContent(meta.id, content);
  const qrOn = useShow((s) => s.qrOn);

  return (
    <SlideShell className="bg-[#05030c]">
      <CourtLines />

      {/* top broadcast header */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between border-b-2 border-ice/10 bg-court/80 px-14 py-4 backdrop-blur-md">
        <div className="flex items-center gap-4 font-mono text-[16px] font-bold tracking-[0.35em] text-ice/80">
          <LiveBug label="TOURNAMENT LIVE" />
          <span>{c.kicker}</span>
        </div>
        <div className="font-mono text-[16px] font-bold tracking-[0.35em] text-volt">
          STAGE 01 OF 02
        </div>
      </div>

      {/* main battle split */}
      <div className="relative z-10 flex h-full items-center justify-between px-16 pb-20 pt-16">
        {/* left column: massive bold typography and game rules */}
        <div className="max-w-[1020px]">
          <ClipWipeReveal delay={0.1}>
            <div className="inline-block border-2 border-mag bg-mag/15 px-5 py-1.5 font-mono text-[14px] font-bold tracking-[0.4em] text-mag">
              INTER-COHORT SHOWDOWN
            </div>
          </ClipWipeReveal>

          <h1 className="mt-4 font-display uppercase leading-[0.82] tracking-tighter text-ice">
            <span className="block text-[160px]">
              <LetterStagger text={c.titleTop} delay={0.2} />
            </span>
            <span className="block -skew-x-6 text-[190px] text-volt">
              <LetterStagger text={c.titleBottom} delay={0.42} />
            </span>
          </h1>

          <ClipWipeReveal delay={0.65} from="left">
            <p className="mt-3 font-serifit text-[38px] italic text-ice/85">
              {c.serif}
            </p>
          </ClipWipeReveal>

          {/* 3 massive stadium rule slabs */}
          <div className="mt-8 flex flex-col gap-4">
            {c.rules.map((r, i) => (
              <ClipWipeReveal key={r.n} delay={0.8 + i * 0.12} from="left">
                <div className="flex items-center justify-between border-l-8 border-volt bg-panel/90 px-8 py-4 backdrop-blur-md">
                  <div className="flex items-center gap-6">
                    <span className="font-display text-[32px] font-black text-volt">
                      {r.n}
                    </span>
                    <span className="font-display text-[26px] font-bold uppercase tracking-wider text-ice">
                      {r.title}
                    </span>
                  </div>
                  <span className="font-mono text-[14px] font-bold tracking-[0.25em] text-volt">
                    {r.tag}
                  </span>
                </div>
              </ClipWipeReveal>
            ))}
          </div>
        </div>

        {/* right column: giant stadium match ticket pass with live QR */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0, x: 50 }}
          animate={{ scale: 1, opacity: 1, x: 0 }}
          transition={{ delay: 0.45, duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-[480px] overflow-hidden border-4 border-ice/20 bg-panel/95 p-8 shadow-2xl backdrop-blur-xl"
        >
          {/* top ticket header */}
          <div className="flex items-center justify-between border-b-2 border-dashed border-ice/20 pb-4">
            <span className="font-mono text-[13px] font-bold tracking-[0.3em] text-mag">
              AUDIENCE MATCH PASS
            </span>
            <span className="font-mono text-[13px] font-bold tracking-[0.3em] text-ice/50">
              #TD26-ARENA
            </span>
          </div>

          {/* QR Code section */}
          <div className="mt-6 flex flex-col items-center">
            <div className="border-4 border-court bg-white p-4 shadow-xl">
              <QRCodeSVG
                value={typeof window !== "undefined" ? `${window.location.origin}/audience` : "https://swagday.app/audience"}
                size={220}
                bgColor="#ffffff"
                fgColor="#08060f"
                level="Q"
              />
            </div>
            <p className="mt-4 font-mono text-[14px] font-bold uppercase tracking-[0.3em] text-volt">
              SCAN TO VOTE & REACT
            </p>
            <p className="mt-1 font-body text-[14px] font-medium text-ice/60">
              Join live from your phone in the stands
            </p>
          </div>

          {/* bottom ticket barcode */}
          <div className="barcode mt-6 h-10 w-full text-ice/30" />
        </motion.div>
      </div>

      {/* bottom ticker */}
      <div className="absolute inset-x-0 bottom-0 z-30">
        <TickerBand items={c.ticker} />
      </div>
    </SlideShell>
  );
}
