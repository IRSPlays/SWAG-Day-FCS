"use client";

/* Countdown — shared live timer chip (stage corner + controller). */

import { useEffect, useState } from "react";

export function useNow(tick = 250): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), tick);
    return () => clearInterval(id);
  }, [tick]);
  return now;
}

export default function Countdown({
  endsAt,
  className = "",
}: {
  endsAt: number | null;
  className?: string;
}) {
  const now = useNow();
  if (!endsAt) return null;
  const left = Math.max(0, endsAt - now);
  const s = Math.ceil(left / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  const hot = left < 10_000;
  return (
    <div
      className={`border-2 px-4 py-2 font-display text-[32px] leading-none tabular-nums ${
        hot ? "border-mag text-mag" : "border-volt text-volt"
      } ${className}`}
    >
      {mm}:{ss}
    </div>
  );
}
