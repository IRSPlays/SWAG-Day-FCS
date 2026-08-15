"use client";

/* /camera — a phone becomes one of SEVERAL live cameras for the stage screen.
   WebRTC peer connection; the show transport carries the signaling.
   Multi-camera: each phone announces a unique camId (cam-hello) and the
   Controller cuts any of them to the stage (cam-active).
   FLIP: front/rear switch swaps the capture live (peer untouched).
   ZOOM: pinch / drag / 1x buttons — the zoom happens on a CANVAS, so the
   zoomed frame is exactly what the stage receives.
   Video only (no audio) — the PA stays with the stage machine. */

import { useEffect, useRef, useState, type TouchEvent as ReactTouchEvent } from "react";
import { getTransport } from "@/realtime/transport";
import { newEventId, type ShowEvent, type ShowEventInput } from "@/realtime/types";

const RTC_CFG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

/* capture tiers - defaults to QHD and falls back gracefully on phones whose
   cameras top out lower (ideal, not exact). Each tier sets a matching encoder
   ceiling: without an explicit maxBitrate browsers silently crush high-res
   streams to ~2.5 Mbps of mush. */
const QUALITIES = [
  { id: "720p", label: "720p", w: 1280, h: 720, mbps: 2.5 },
  { id: "1080p", label: "1080p", w: 1920, h: 1080, mbps: 5 },
  { id: "1440p", label: "1440p", w: 2560, h: 1440, mbps: 9 },
] as const;
type QualityId = (typeof QUALITIES)[number]["id"];

const ZOOM_MAX = 5;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export default function CameraPage() {
  const [status, setStatus] = useState<"idle" | "live" | "error">("idle");
  const [quality, setQuality] = useState<QualityId>("1440p");
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [resBadge, setResBadge] = useState("");

  const camIdRef = useRef("");
  const srcVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cStreamRef = useRef<MediaStream | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const rafRef = useRef(0);

  /* mirrors of zoom/pan for the rAF draw loop (no re-render churn) */
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const facingRef = useRef<"user" | "environment">("user");

  const touchRef = useRef<{ id: number; x: number; y: number }[]>([]);
  const gestureRef = useRef({ dist: 0, mid: { x: 0, y: 0 } });

  const send = (e: ShowEventInput) =>
    getTransport().publish({ ...e, id: newEventId(), ts: Date.now() } as ShowEvent);

  const setZoomBoth = (v: number) => {
    const z = clamp(v, 1, ZOOM_MAX);
    zoomRef.current = z;
    setZoom(z);
  };

  /* draw the live camera into the canvas with zoom + pan applied. the canvas
     IS the streamed frame, so pinch/drag shows up verbatim on the stage. */
  const drawLoop = () => {
    const canvas = canvasRef.current;
    const video = srcVideoRef.current;
    if (canvas && video && video.videoWidth > 0) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const W = canvas.width;
        const H = canvas.height;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, W, H);
        const z = zoomRef.current;
        const dw = W * z;
        const dh = H * z;
        const ox = (W - dw) / 2 + (panRef.current.x * (W - dw)) / 2;
        const oy = (H - dh) / 2 + (panRef.current.y * (H - dh)) / 2;
        ctx.drawImage(video, ox, oy, dw, dh);
      }
    }
    rafRef.current = requestAnimationFrame(drawLoop);
  };

  const stop = () => {
    if (camIdRef.current) send({ type: "cam-bye", camId: camIdRef.current });
    cancelAnimationFrame(rafRef.current);
    unsubRef.current?.();
    pcRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    cStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current = null;
    streamRef.current = null;
    cStreamRef.current = null;
    if (srcVideoRef.current) srcVideoRef.current.srcObject = null;
    camIdRef.current = "";
    setResBadge("");
    setStatus("idle");
  };

  const grabCamera = async (which: "user" | "environment", q: (typeof QUALITIES)[number]) => {
    const src = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: which,
        /* ideal lets weak cameras drop a tier instead of failing */
        width: { ideal: q.w },
        height: { ideal: q.h },
        frameRate: { ideal: 30, max: 30 },
      },
      audio: false,
    });
    streamRef.current = src;
    const v = srcVideoRef.current;
    if (!v) {
      src.getTracks().forEach((t) => t.stop());
      throw new Error("no preview");
    }
    v.srcObject = src;
    await new Promise<void>((resolve) => {
      if (v.videoWidth > 0) resolve();
      else v.onloadedmetadata = () => resolve();
    });
    /* resize the canvas to the camera's ACTUAL resolution */
    const caps = src.getVideoTracks()[0]?.getSettings();
    const cw = (caps?.width && caps.width < q.w ? caps.width : q.w) || q.w;
    const ch = (caps?.height && caps.height < q.h ? caps.height : q.h) || q.h;
    if (canvasRef.current) {
      canvasRef.current.width = cw;
      canvasRef.current.height = ch;
    }
    setResBadge(`${cw}×${ch}${caps?.frameRate ? ` @ ${Math.round(caps.frameRate)}fps` : ""}`);
  };

  const goLive = async (pick: QualityId = quality) => {
    try {
      stop();
      camIdRef.current = `cam-${Math.random().toString(36).slice(2, 9)}`;
      setQuality(pick);
      const q = QUALITIES.find((x) => x.id === pick)!;

      await grabCamera(facingRef.current, q);
      if (!canvasRef.current) throw new Error("no canvas");

      /* the canvas (zoom/flip layer) is what we transmit */
      const cStream = canvasRef.current.captureStream(30);
      cStreamRef.current = cStream;
      const cTrack = cStream.getVideoTracks()[0];

      const pc = new RTCPeerConnection(RTC_CFG);
      pcRef.current = pc;
      const t = getTransport();
      try {
        /* addTransceiver pins the encoder budget BEFORE negotiation */
        pc.addTransceiver(cTrack, {
          streams: [cStream],
          sendEncodings: [{ maxBitrate: q.mbps * 1_000_000, maxFramerate: 30 }],
        });
      } catch {
        cStream.getTracks().forEach((tr) => pc.addTrack(tr, cStream));
      }
      pc.onicecandidate = (e) => {
        if (e.candidate)
          send({ type: "cam-ice", from: "phone", camId: camIdRef.current, candidate: e.candidate.toJSON() });
      };

      unsubRef.current = t.subscribe(async (ev) => {
        if (ev.type === "cam-request") {
          /* already up? ignore the heartbeat - stops the renegotiation churn */
          if (pc.connectionState === "connected") return;
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            send({ type: "cam-offer", camId: camIdRef.current, sdp: offer });
          } catch {
            /* pc closed */
          }
        } else if (ev.type === "cam-answer") {
          if (ev.camId !== camIdRef.current) return;
          try {
            await pc.setRemoteDescription(ev.sdp);
          } catch {
            /* stale */
          }
        } else if (ev.type === "cam-ice" && ev.from === "stage") {
          if (ev.camId !== camIdRef.current) return;
          try {
            await pc.addIceCandidate(ev.candidate);
          } catch {
            /* race */
          }
        }
      });

      rafRef.current = requestAnimationFrame(drawLoop);
      send({ type: "cam-hello", camId: camIdRef.current });
      setStatus("live");
    } catch {
      stop();
      setStatus("error");
    }
  };

  /* FLIP — restart the capture, leave the canvas stream + peer totally intact */
  const flip = async () => {
    const next: "user" | "environment" = facingRef.current === "user" ? "environment" : "user";
    facingRef.current = next;
    setFacing(next);
    if (status !== "live") return;
    try {
      const q = QUALITIES.find((x) => x.id === quality)!;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      await grabCamera(next, q);
      zoomRef.current = 1;
      panRef.current = { x: 0, y: 0 };
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } catch {
      setStatus("error");
    }
  };

  /* ---------------- pinch / drag / double-tap gestures ---------------- */
  const onTouchStart = (e: ReactTouchEvent) => {
    touchRef.current = Array.from(e.touches).map((tn) => ({ id: tn.identifier, x: tn.clientX, y: tn.clientY }));
    if (touchRef.current.length === 2) {
      const [a, b] = touchRef.current;
      gestureRef.current.dist = Math.hypot(b.x - a.x, b.y - a.y);
      gestureRef.current.mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }
  };

  const onTouchMove = (e: ReactTouchEvent) => {
    const to = e.touches;
    if (to.length === 2) {
      e.preventDefault();
      const [a, b] = Array.from(to);
      const dist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
      const mid = { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
      setZoomBoth(zoomRef.current * (dist / (gestureRef.current.dist || dist)));
      gestureRef.current.dist = dist;
      if (gestureRef.current.mid.x) {
        const p = panRef.current;
        p.x = clamp(p.x + (mid.x - gestureRef.current.mid.x) / 260, -1, 1);
        p.y = clamp(p.y + (mid.y - gestureRef.current.mid.y) / 260, -1, 1);
        setPan({ ...p });
      }
      gestureRef.current.mid = mid;
      if (zoomRef.current <= 1) {
        panRef.current = { x: 0, y: 0 };
        setPan({ x: 0, y: 0 });
      }
    } else if (to.length === 1 && zoomRef.current > 1) {
      const a = Array.from(to)[0];
      const prev = touchRef.current[0];
      if (prev) {
        const p = panRef.current;
        p.x = clamp(p.x + (a.clientX - prev.x) / 260, -1, 1);
        p.y = clamp(p.y + (a.clientY - prev.y) / 260, -1, 1);
        setPan({ ...p });
      }
      touchRef.current = [{ id: a.identifier, x: a.clientX, y: a.clientY }];
    }
  };

  const onTouchEnd = () => {
    touchRef.current = [];
    gestureRef.current.mid = { x: 0, y: 0 };
  };

  const onDoubleTap = () => {
    if (zoomRef.current > 1) {
      setZoomBoth(1);
      panRef.current = { x: 0, y: 0 };
      setPan({ x: 0, y: 0 });
    } else {
      setZoomBoth(2);
    }
  };

  /* unmount cleanup */
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      unsubRef.current?.();
      pcRef.current?.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      cStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 bg-court px-5 py-6 text-ice">
      <header>
        <div className="font-body text-[11px] font-bold tracking-[0.4em] text-mag">STAGE CAM</div>
        <h1 className="mt-1 font-display text-4xl uppercase leading-[0.9]">
          You&apos;re the <span className="text-volt">camera</span> now
        </h1>
      </header>

      {/* quality + flip */}
      <div className="flex flex-wrap items-center gap-2">
        {QUALITIES.map((q) => (
          <button
            key={q.id}
            onClick={() => {
              if (q.id !== quality) {
                if (status === "live") void goLive(q.id);
                else setQuality(q.id);
              }
            }}
            className={`border-2 px-3 py-2 font-body text-[11px] font-bold tracking-[0.18em] transition-colors ${
              quality === q.id ? "border-volt bg-volt/10 text-volt" : "border-ice/20 text-ice/50"
            }`}
          >
            {q.label}
          </button>
        ))}
        <button
          onClick={() => void flip()}
          className={`ml-auto border-2 px-3 py-2 font-body text-[11px] font-bold tracking-[0.18em] ${
            facing === "environment" ? "border-mag text-mag" : "border-ice/25 text-ice/70"
          }`}
        >
          ⇄ {facing === "user" ? "FRONT" : "REAR"}
        </button>
      </div>

      {/* live preview — the canvas IS what the stage receives */}
      <div
        className="relative aspect-video w-full touch-none overflow-hidden border-2 border-ice/20 bg-black"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onDoubleClickCapture={onDoubleTap}
      >
        <video ref={srcVideoRef} autoPlay playsInline muted className="hidden" />
        <canvas ref={canvasRef} className="h-full w-full object-contain" />
        {zoom > 1 && (
          <div className="absolute right-2 top-2 border border-volt bg-black/70 px-2 py-1 font-body text-[11px] font-bold tracking-[0.2em] text-volt">
            {zoom.toFixed(1)}×
          </div>
        )}
      </div>

      {/* zoom controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setZoomBoth(zoomRef.current - 0.5)}
          className="h-10 w-10 border-2 border-ice/25 font-display text-lg text-ice/70"
        >
          −
        </button>
        <button
          onClick={onDoubleTap}
          className={`h-10 border-2 px-3 font-body text-[12px] font-bold tracking-[0.2em] ${
            zoom > 1 ? "border-volt text-volt" : "border-ice/25 text-ice/50"
          }`}
        >
          {zoom > 1 ? `${zoom.toFixed(1)}× ON` : "1× RESET"}
        </button>
        <button
          onClick={() => setZoomBoth(zoomRef.current + 0.5)}
          className="h-10 w-10 border-2 border-ice/25 font-display text-lg text-ice/70"
        >
          ＋
        </button>
        <span className="ml-auto font-body text-[10px] font-bold tracking-[0.2em] text-ice/40">
          PINCH · DRAG · DOUBLE-TAP
        </span>
      </div>

      {status !== "live" ? (
        <button
          onClick={() => void goLive()}
          className="border-2 border-mag bg-mag py-4 font-display text-2xl uppercase text-ice"
        >
          ● Go live on stage
        </button>
      ) : (
        <button
          onClick={stop}
          className="border-2 border-ice/30 py-4 font-display text-2xl uppercase text-ice/70"
        >
          ■ Stop
        </button>
      )}

      {status === "error" && (
        <p className="font-body text-sm text-mag">
          Camera permission denied — allow camera access and retry.
        </p>
      )}
      {status === "live" && (
        <p className="font-body text-sm text-ice/60">
          {resBadge ? (
            <>
              Streaming <span className="font-bold text-volt">{resBadge}</span> · {facing.toUpperCase()} CAM
            </>
          ) : (
            "Streaming to the stage screen whenever the Tech Lead hits STAGE CAM."
          )}
        </p>
      )}
    </main>
  );
}