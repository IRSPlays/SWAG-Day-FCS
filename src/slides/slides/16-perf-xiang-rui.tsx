"use client";

/* 16 · PERFORMANCE — Xiang Rui, solo.
    Song TBC — this card introduces the act; swap in a lyric slide
    (copy a perf-* slide) once the song is confirmed. */

import { PerformerCard, type PerformerCardContent } from "./performer-card";
import type { SlideMeta } from "../types";

export const meta: SlideMeta = {
  id: "perf-xiang-rui",
  title: "16 · Solo — Xiang Rui",
  transition: "baton-change",
  durationHint: 20,
  notes:
    "Last solo performance before the final band items. Welcome Xiang Rui onto the stage! Song TBC — swap for a lyric slide when confirmed.",
  accent: "vio",
};

export const content: PerformerCardContent = {
  kicker: "PERFORMANCE · SOLO VOCALS",
  actNo: "6",
  name: "XIANG RUI",
  actType: "SOLO VOCALS",
  detail: "AN ADMIRAL VOICE · LIVE ON STAGE",
  cheer: "let's hear it!",
};

export default function PerfXiangRui() {
  return <PerformerCard slideMeta={meta} content={content} />;
}
