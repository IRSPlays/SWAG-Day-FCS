"use client";

/* ScaledFrame — renders a fixed 1920×1080 broadcast canvas that scales
   to fit any viewport/projector. Slide content is authored once at
   design resolution; letterboxing keeps the composition intact. */

import { useEffect, useRef, useState } from "react";

export const DESIGN_W = 1920;
export const DESIGN_H = 1080;

export default function ScaledFrame({
  children,
  letterbox = "#05070d",
}: {
  children: React.ReactNode;
  letterbox?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const compute = () => {
      const { width, height } = el.getBoundingClientRect();
      setScale(Math.min(width / DESIGN_W, height / DESIGN_H));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="relative h-full w-full overflow-hidden"
      style={{ background: letterbox }}
    >
      <div
        className="absolute left-1/2 top-1/2 overflow-hidden"
        style={{
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {scale > 0 ? children : null}
      </div>
    </div>
  );
}
