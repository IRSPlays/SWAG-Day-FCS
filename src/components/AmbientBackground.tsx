"use client";

/* AmbientBackground v4 — "halftime field". No text, no decoration-for-
   decoration's sake. Built on light physics, not ornament:

   1. THE FIELD — a fine, slightly-jittered dot grid (jumbotron/halftone
      DNA) in warm ink at whisper contrast. Static by itself.
   2. THE CREST (dynamic) — every pass, a luminance wave travels a NEW
      random bezier path across the field. Dots swell under it with a
      gaussian falloff; the head carries exactly one brand color per
      pass (blue/red/orange), so the wake is monochrome and the head
      is the only color on screen. Never repeats → feels alive.
   3. TWINKLE (passive) — ~3.5% of dots breathe on individual slow
      sines. Nothing synchronized, nothing mechanical.
   4. PROJECTOR FALLOFF (physical gradient) — the vignette is a
      projector throwing on a hall: transparent center, ink at ~4% at
      the extreme edges. The only gradient in the system, and it's
      lighting, not decoration.

   Canvas-based (single rAF, DPR-aware, pauses when tab hidden) so the
   stage PC renders it for free. Ink reads the live --color-ice token,
   so it inverts correctly inside .page-light scopes.
   Reduced motion: one static frame, crest frozen mid-path. */

import { useEffect, useRef } from "react";

const ACCENTS = ["#4758d6", "#ea3a3a", "#e1811f"] as const;

const GAP = 46; // px between grid dots at 1x
const BASE_R = 1.5; // rest dot radius
const BASE_A = 0.09; // rest dot alpha
const CREST_R = 150; // crest influence radius
const CREST_REST_MIN = 5000;
const CREST_REST_MAX = 9000;
const CREST_DUR_MIN = 16000;
const CREST_DUR_MAX = 23000;

type Dot = { x: number; y: number; r: number; spark: boolean; phase: number; period: number };
type Crest = {
  x0: number; y0: number; cx: number; cy: number; x1: number; y1: number;
  start: number; duration: number; accent: string;
};

function parseHex(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (m) {
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  return [32, 28, 28]; // warm black fallback
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

function bezier(c: Crest, u: number): { x: number; y: number } {
  const v = 1 - u;
  return {
    x: v * v * c.x0 + 2 * v * u * c.cx + u * u * c.x1,
    y: v * v * c.y0 + 2 * v * u * c.cy + u * u * c.y1,
  };
}

function edgePoint(w: number, h: number, edge: number) {
  // 0 left · 1 right · 2 top · 3 bottom — slightly outside the frame
  const p = Math.random();
  switch (edge) {
    case 0: return { x: -40, y: p * h };
    case 1: return { x: w + 40, y: p * h };
    case 2: return { x: p * w, y: -40 };
    default: return { x: p * w, y: h + 40 };
  }
}

function makeCrest(w: number, h: number, t: number): Crest {
  const e = Math.floor(Math.random() * 4);
  const from = edgePoint(w, h, e);
  const to = edgePoint(w, h, (e + 2) % 4); // opposite edge → full sweep
  return {
    x0: from.x, y0: from.y,
    x1: to.x, y1: to.y,
    cx: w * (0.25 + Math.random() * 0.5),
    cy: h * (0.25 + Math.random() * 0.5),
    start: t,
    duration: CREST_DUR_MIN + Math.random() * (CREST_DUR_MAX - CREST_DUR_MIN),
    accent: ACCENTS[Math.floor(Math.random() * ACCENTS.length)],
  };
}

function buildField(w: number, h: number): Dot[] {
  const dots: Dot[] = [];
  const cols = Math.ceil(w / GAP) + 1;
  const rows = Math.ceil(h / GAP) + 1;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = i * GAP + (Math.random() - 0.5) * 8;
      const y = j * GAP + (Math.random() - 0.5) * 8;
      dots.push({
        x, y,
        r: Math.random() < 0.04 ? BASE_R * 1.5 : BASE_R,
        spark: Math.random() < 0.035,
        phase: Math.random() * Math.PI * 2,
        period: 3.5 + Math.random() * 4.5,
      });
    }
  }
  return dots;
}

export default function AmbientBackground({
  className = "",
}: {
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const ink = parseHex(
      getComputedStyle(canvas).getPropertyValue("--color-ice") || "#201c1c"
    );

    let w = 0;
    let h = 0;
    let dots: Dot[] = [];
    let crest: Crest | null = null;
    let nextCrestAt = 800; // first crest shortly after mount
    let raf = 0;
    let running = true;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      dots = buildField(w, h);
    };

    const paint = (t: number, frozenHead: { x: number; y: number } | null) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // projector falloff — transparent center, ink at the extremes
      const maxDim = Math.max(w, h);
      const g = ctx.createRadialGradient(
        w / 2, h / 2, maxDim * 0.28,
        w / 2, h / 2, maxDim * 0.78
      );
      g.addColorStop(0, `rgba(${ink[0]},${ink[1]},${ink[2]},0)`);
      g.addColorStop(1, `rgba(${ink[0]},${ink[1]},${ink[2]},0.04)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const accent = crest?.accent ?? ACCENTS[0];
      const acc = parseHex(accent);

      for (const d of dots) {
        let r = d.r;
        let a = BASE_A;

        if (d.spark) {
          a += 0.07 * (0.5 + 0.5 * Math.sin((t / 1000) * ((Math.PI * 2) / d.period) + d.phase));
        }

        let headColor: [number, number, number] | null = null;
        const head = frozenHead;
        if (head) {
          const dx = d.x - head.x;
          const dy = d.y - head.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CREST_R) {
            const f = 1 - dist / CREST_R;
            const gs = f * f;
            r = d.r * (1 + 3.5 * gs);
            a = Math.min(0.32, a + 0.26 * gs);
            if (dist < CREST_R * 0.42) headColor = acc;
          }
        }

        const c = headColor ?? ink;
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const frame = (t: number) => {
      if (!running) return;

      if (!crest && t >= nextCrestAt) crest = makeCrest(w, h, t);

      let head: { x: number; y: number } | null = null;
      if (crest) {
        const p = (t - crest.start) / crest.duration;
        if (p >= 1) {
          crest = null;
          nextCrestAt = t + CREST_REST_MIN + Math.random() * (CREST_REST_MAX - CREST_REST_MIN);
        } else {
          head = bezier(crest, easeInOut(p));
        }
      }

      paint(t, head);
      raf = requestAnimationFrame(frame);
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduced) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduced || !running) {
        // static frame for reduced motion / hidden tab
        crest = crest ?? makeCrest(w, h, 0);
        paint(0, bezier(crest, 0.5));
      }
    });
    ro.observe(canvas);

    if (reduced) {
      crest = makeCrest(w, h, 0);
      paint(0, bezier(crest, 0.5)); // frozen mid-path, still composed
    } else {
      raf = requestAnimationFrame(frame);
      document.addEventListener("visibilitychange", onVisibility);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <canvas ref={ref} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
