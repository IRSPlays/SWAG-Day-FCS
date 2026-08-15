/* Shared lyric parsing — ONE parser used by the stage renderer (LyricsMograph)
   and the /lyrics operator console, so both machines always agree on what a
   "line" is. Turns official word-synced TTML (or a plain cue list) into a
   structured lines[] with per-word timings. */

import type { LyricCue } from "@/slides/lyrics";

export interface LyricWord {
  text: string;
  /** seconds — when this word is sung */
  t: number;
  end: number;
}

export interface LyricLine {
  text: string;
  t: number;
  end: number;
  words: LyricWord[];
}

export interface ParsedLyrics {
  lines: LyricLine[];
  duration: number;
}

/** TTML clock "0:00:18.900" / "18.9s" / "18.9" → seconds */
export function tcToSec(tc: string): number {
  const s = tc.trim();
  let m = /^(\d+):(\d+):(\d+(?:\.\d+)?)$/.exec(s);
  if (m) return +m[1] * 3600 + +m[2] * 60 + parseFloat(m[3]);
  m = /^(\d+):(\d+(?:\.\d+)?)$/.exec(s);
  if (m) return +m[1] * 60 + parseFloat(m[2]);
  m = /^(\d+(?:\.\d+)?)s$/i.exec(s);
  if (m) return parseFloat(m[1]);
  return parseFloat(s) || 0;
}

/** official word-synced TTML → structured lines (DOMParser: client-side only) */
export function parseTtml(doc: string): ParsedLyrics {
  const xml = new DOMParser().parseFromString(doc, "text/xml");
  const ps = Array.from(xml.getElementsByTagName("p"));
  const lines: LyricLine[] = [];
  for (const p of ps) {
    const begin = tcToSec(p.getAttribute("begin") ?? "0");
    const end = tcToSec(p.getAttribute("end") ?? String(begin + 4));
    const spans = Array.from(p.getElementsByTagName("span"));
    const words: LyricWord[] = (
      spans.length
        ? spans.map((sp) => ({
            text: (sp.textContent ?? "").trim(),
            t: tcToSec(sp.getAttribute("begin") ?? String(begin)),
            end: tcToSec(sp.getAttribute("end") ?? String(end)),
          }))
        : (p.textContent ?? "")
            .split(/\s+/)
            .filter(Boolean)
            .map((w, i, arr) => ({
              text: w,
              t: begin + (i / arr.length) * (end - begin),
              end: begin + ((i + 1) / arr.length) * (end - begin),
            }))
    ).filter((w) => w.text);
    const text = (p.textContent ?? "").replace(/\s+/g, " ").trim();
    if (text) lines.push({ text, t: begin, end, words });
  }
  lines.sort((a, b) => a.t - b.t);
  const duration = lines.reduce((mx, l) => Math.max(mx, l.end), 0);
  return { lines, duration };
}

/** plain cue list → estimated word timings (length-weighted, natural sweep) */
export function cuesToLines(cues: LyricCue[]): ParsedLyrics {
  const lines: LyricLine[] = cues.map((c, i) => {
    const end = i + 1 < cues.length ? cues[i + 1].t : c.t + 4;
    const words = c.text.split(/\s+/).filter(Boolean);
    const weights = words.map((w) => Math.max(2, w.replace(/[^\p{L}\p{N}]/gu, "").length));
    const total = weights.reduce((a, b) => a + b, 0) || 1;
    let cursor = c.t;
    return {
      text: c.text,
      t: c.t,
      end,
      words: words.map((w, k) => {
        const wDur = (weights[k] / total) * (end - c.t);
        const word = { text: w, t: cursor, end: cursor + wDur };
        cursor += wDur;
        return word;
      }),
    };
  });
  const duration = lines.reduce((mx, l) => Math.max(mx, l.end), 0);
  return { lines, duration };
}

/** 214.3 → "3:34" */
export function fmtClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** which section marker applies at time t */
export function sectionAt(t: number, sections: { t: number; label: string }[]): string {
  let s = sections[0]?.label ?? "";
  for (const sec of sections) if (sec.t <= t) s = sec.label;
  return s;
}
