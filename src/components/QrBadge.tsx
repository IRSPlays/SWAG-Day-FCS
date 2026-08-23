"use client";

/* QrBadge — audience join code, corner of the stage frame. */

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function QrBadge({ className = "" }: { className?: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    setUrl(`${window.location.origin}/audience`);
  }, []);

  return (
    <div
      className={`flex items-center gap-4 border-2 border-ice/25 bg-court/85 p-3 backdrop-blur-sm ${className}`}
    >
      <div className="bg-ice p-2">
        {url ? (
          <QRCodeSVG value={url} size={92} bgColor="#f4f7ff" fgColor="#08060f" />
        ) : (
          <div className="h-[92px] w-[92px]" />
        )}
      </div>
      <div>
        <div className="font-body text-[15px] font-bold tracking-[0.3em] text-volt">
          JOIN THE HYPE
        </div>
        <div className="mt-1 font-body text-[13px] font-medium tracking-[0.18em] text-ice/60">
          SCAN · REACT · VOTE
        </div>
      </div>
    </div>
  );
}
