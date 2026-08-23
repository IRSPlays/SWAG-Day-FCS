"use client";

/* SlideShell — the broadcast frame every slide lives in.
   Adds film grain, vignette and safe-area corner ticks.
   Layout primitives (ticker band, live bug, court lines) live here too. */

import type { ReactNode } from "react";
import { MarqueeTicker } from "@/animations";

export function CornerTicks() {
  const base = "absolute h-8 w-8 border-ice/25";
  return (
    <>
      <span className={`${base} left-6 top-6 border-l-2 border-t-2`} />
      <span className={`${base} right-6 top-6 border-r-2 border-t-2`} />
      <span className={`${base} bottom-6 left-6 border-b-2 border-l-2`} />
      <span className={`${base} bottom-6 right-6 border-b-2 border-r-2`} />
    </>
  );
}

export function CourtLines({ className = "" }: { className?: string }) {
  return <div className={`bg-lanes pointer-events-none absolute inset-0 ${className}`} />;
}

export function LiveBug({ label = "LIVE" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 border-2 border-mag bg-mag/15 px-4 py-2">
      <span className="relative flex h-3.5 w-3.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mag opacity-70" />
        <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-mag" />
      </span>
      <span className="font-body text-xl font-bold tracking-[0.3em] text-mag">{label}</span>
    </div>
  );
}

export function TickerBand({ items, className = "" }: { items: string[]; className?: string }) {
  const row = (
    <div className="flex items-center py-3">
      {items.map((it) => (
        <span key={it} className="flex items-center">
          <span className="px-6 font-display text-4xl uppercase tracking-wide text-court">
            {it}
          </span>
          <span className="text-3xl text-court/50">★</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className={`border-t-4 border-court bg-volt ${className}`}>
      <MarqueeTicker duration={26}>{row}</MarqueeTicker>
    </div>
  );
}

export default function SlideShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative h-full w-full overflow-hidden bg-court text-ice ${className}`}>
      <div className="vignette pointer-events-none absolute inset-0 z-0" />
      <div className="relative z-10 h-full w-full">{children}</div>
      <div className="bg-noise pointer-events-none absolute inset-0 z-20 opacity-[0.06] mix-blend-overlay" />
      <div className="pointer-events-none absolute inset-0 z-30">
        <CornerTicks />
      </div>
    </div>
  );
}
