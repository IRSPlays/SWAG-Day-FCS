"use client";

/* LyricBackdrop — the performance atmosphere. No audio file needed:
    the band plays live, the screen BREATHES at the song's tempo.
    BPM pulse rings + a floor equalizer + an accent glow whose energy
    is driven by the current section (chorus = full burn). */

import { useMemo } from "react";
import { motion } from "motion/react";

export interface LyricBackdropProps {
  bpm: number;
  /** 0..1 — verse ~0.6, chorus 1 */
  energy: number;
  accent?: "volt" | "mag" | "vio";
}

const ACCENT_HEX: Record<string, string> = {
  volt: "#4758d6",
  mag: "#ea3a3a",
  vio: "#e1811f",
};

export default function LyricBackdrop({ bpm, energy, accent = "vio" }: LyricBackdropProps) {
  const beat = 60 / Math.max(40, bpm);
  const hex = ACCENT_HEX[accent];

  /* deterministic pseudo-random heights so SSR/CSR match */
  const bars = useMemo(
    () => Array.from({ length: 28 }, (_, i) => 0.25 + 0.75 * Math.abs(Math.sin(i * 12.9898) % 1)),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* accent glow — blooms with the section energy */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[1400px] w-[1400px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: `radial-gradient(circle, ${hex}55 0%, transparent 60%)` }}
        animate={{ opacity: 0.35 + energy * 0.65, scale: 0.9 + energy * 0.18 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />

      {/* BPM pulse rings — one wave departs every beat, staggered like echoes */}
      {[0, 0.33, 0.66].map((frac, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ border: `2px solid ${hex}` }}
          initial={{ scale: 0.35, opacity: 0 }}
          animate={{ scale: [0.35, 2.1], opacity: [0, 0.5 * energy, 0] }}
          transition={{ duration: beat * 3, times: [0, 0.35, 1], repeat: Infinity, delay: frac * beat * 3, ease: "easeOut" }}
        />
      ))}

      {/* floor equalizer */}
      <div className="absolute inset-x-0 bottom-0 flex h-[240px] items-end gap-[10px] px-16 opacity-40">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            className="flex-1"
            style={{ background: `linear-gradient(to top, ${hex}33, ${hex})` }}
            initial={{ height: `${h * 12}%` }}
            animate={{ height: [`${h * 18}%`, `${h * 100}%`, `${h * 30}%`, `${h * 84}%`, `${h * 18}%`] }}
            transition={{ duration: beat * 2 * (0.8 + h), repeat: Infinity, ease: "easeInOut", delay: i * 0.045 }}
          />
        ))}
      </div>

      {/* lane lines tie it back to the court theme */}
      <div className="bg-lanes absolute inset-0 opacity-[0.06]" />
    </div>
  );
}