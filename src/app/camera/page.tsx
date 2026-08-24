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
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
    { urls: ["stun:stun2.l.google.com:19302", "stun:stun3.l.google.com:19302"] },
    { urls: ["stun:stun.cloudflare.com:3478"] },
    { urls: ["stun:stun.services.mozilla.com"] },
  ],
  iceCandidatePoolSize: 10,
};

/* capture tiers - defaults to 1080p and falls back gracefully on phones whose
   cameras top out lower (ideal, not exact). */
const QUALITIES = [
  { id: "720p", label: "720p", w: 1280, h: 720, mbps: 2.5 },
  { id: "1080p", label: "1080p", w: 1920, h: 1080, mbps: 5 },
  { id: "1440p", label: "1440p", w: 2560, h: 1440, mbps: 9 },
] as const;
type QualityId = (typeof QUALITIES)[number]["id"];

const ZOOM_MAX = 5;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export default function CameraPage() {
  const [status, setStatus] = useState<"idle" | "connecting" | "live" | "error">("idle");
  const [quality, setQuality] = useState<QualityId>("1080p");
  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [resBadge, setResBadge] = useState("");
  const [linkStatus, setLinkStatus] = useState("DISCONNECTED");

  const camIdRef = useRef("");
  const srcVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cStreamRef = useRef<MediaStream | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const rafRef = useRef(0);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const isNegotiatingRef = useRef(false);

  /* mirrors of zoom/pan for the rAF draw loop (no re-render churn) */
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const facingRef = useRef<"user" | "environment">("environment");

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
    if (canvas && video && video.videoWidth > 0 && video.videoHeight > 0) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const W = canvas.width;
        const H = canvas.height;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, W, H);
        /* cover: scale so the frame FILLS the canvas, crop the overflow */
        const z = zoomRef.current;
        const scale = Math.max(W / video.videoWidth, H / video.videoHeight) * z;
        const dw = video.videoWidth * scale;
        const dh = video.videoHeight * scale;
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
    pendingIceCandidatesRef.current = [];
    isNegotiatingRef.current = false;
    if (srcVideoRef.current) srcVideoRef.current.srcObject = null;
    camIdRef.current = "";
    setResBadge("");
    setStatus("idle");
    setLinkStatus("DISCONNECTED");
  };

  const grabCamera = async (which: "user" | "environment", q: (typeof QUALITIES)[number]) => {
    const src = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: which,
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
      throw new Error("no preview video element");
    }
    v.srcObject = src;

    await new Promise<void>((resolve) => {
      const rvfc = (v as HTMLVideoElement & {
        requestVideoFrameCallback?: (cb: () => void) => number;
      }).requestVideoFrameCallback;
      if (typeof rvfc === "function") {
        rvfc.call(v, () => resolve());
      } else if (v.readyState >= 2 && v.videoWidth > 0) {
        resolve();
      } else {
        v.onloadeddata = () => resolve();
        setTimeout(resolve, 1500);
      }
    });

    if (canvasRef.current) {
      canvasRef.current.width = q.w;
      canvasRef.current.height = q.h;
    }
    const caps = src.getVideoTracks()[0]?.getSettings();
    setResBadge(
      `${caps?.width ?? q.w}×${caps?.height ?? q.h}${
        caps?.frameRate ? ` @ ${Math.round(caps.frameRate)}fps` : ""
      }`
    );
  };

  const sendOffer = async (pc: RTCPeerConnection, camId: string) => {
    if (isNegotiatingRef.current || pc.signalingState !== "stable") return;
    try {
      isNegotiatingRef.current = true;
      const offer = await pc.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
      });
      await pc.setLocalDescription(offer);
      send({ type: "cam-offer", camId, sdp: offer });
    } catch (err) {
      console.warn("createOffer error:", err);
    } finally {
      isNegotiatingRef.current = false;
    }
  };

  const goLive = async (pick: QualityId = quality) => {
    try {
      stop();
      setStatus("connecting");
      setLinkStatus("INITIALIZING...");
      const camId = `cam-${Math.random().toString(36).slice(2, 9)}`;
      camIdRef.current = camId;
      setQuality(pick);
      const q = QUALITIES.find((x) => x.id === pick)!;

      await grabCamera(facingRef.current, q);
      if (!canvasRef.current) throw new Error("no canvas");

      /* capture canvas stream, fallback to raw camera stream if unsupported */
      let cStream: MediaStream;
      try {
        cStream = canvasRef.current.captureStream(30);
        if (!cStream.getVideoTracks().length) throw new Error("no canvas track");
      } catch {
        cStream = streamRef.current!.clone();
      }
      cStreamRef.current = cStream;
      const cTrack = cStream.getVideoTracks()[0];

      const pc = new RTCPeerConnection(RTC_CFG);
      pcRef.current = pc;
      pendingIceCandidatesRef.current = [];

      try {
        pc.addTransceiver(cTrack, {
          direction: "sendonly",
          streams: [cStream],
          sendEncodings: [{ maxBitrate: q.mbps * 1_000_000, maxFramerate: 30 }],
        });
      } catch {
        pc.addTrack(cTrack, cStream);
      }

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          send({
            type: "cam-ice",
            from: "phone",
            camId: camIdRef.current,
            candidate: e.candidate.toJSON(),
          });
        }
      };

      pc.onconnectionstatechange = () => {
        const s = pc.connectionState;
        if (s === "connected") {
          setStatus("live");
          setLinkStatus("ON AIR · CONNECTED");
        } else if (s === "connecting") {
          setLinkStatus("CONNECTING TO STAGE...");
        } else if (s === "disconnected" || s === "failed") {
          setLinkStatus("RECONNECTING...");
          void sendOffer(pc, camIdRef.current);
        }
      };

      pc.oniceconnectionstatechange = () => {
        const is = pc.iceConnectionState;
        if (is === "connected" || is === "completed") {
          setStatus("live");
          setLinkStatus("ON AIR · CONNECTED");
        }
      };

      /* LATENCY TUNING */
      try {
        cTrack.contentHint = "motion";
      } catch {}

      const t = getTransport();
      unsubRef.current = t.subscribe(async (ev) => {
        if (ev.type === "cam-request") {
          if (pc.connectionState !== "connected" && pc.signalingState === "stable") {
            await sendOffer(pc, camIdRef.current);
          }
        } else if (ev.type === "cam-answer") {
          if (ev.camId !== camIdRef.current) return;
          if (pc.signalingState === "have-local-offer") {
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(ev.sdp));
              /* flush pending ice candidates */
              while (pendingIceCandidatesRef.current.length > 0) {
                const cand = pendingIceCandidatesRef.current.shift();
                if (cand) {
                  try {
                    await pc.addIceCandidate(new RTCIceCandidate(cand));
                  } catch (e) {
                    console.warn("addIceCandidate error:", e);
                  }
                }
              }
            } catch (err) {
              console.warn("setRemoteDescription answer error:", err);
            }
          }
        } else if (ev.type === "cam-ice" && ev.from === "stage") {
          if (ev.camId !== camIdRef.current) return;
          if (pc.remoteDescription && pc.remoteDescription.type) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(ev.candidate));
            } catch (err) {
              console.warn("addIceCandidate error:", err);
            }
          } else {
            pendingIceCandidatesRef.current.push(ev.candidate);
          }
        }
      });

      rafRef.current = requestAnimationFrame(drawLoop);

      /* Announce camera and initiate WebRTC handshake immediately */
      send({ type: "cam-hello", camId });
      await sendOffer(pc, camId);
      setStatus("connecting");
      setLinkStatus("NEGOTIATING STAGE LINK...");
    } catch (err) {
      console.error("goLive failed:", err);
      stop();
      setStatus("error");
      setLinkStatus("CAMERA PERMISSION ERROR");
    }
  };

  /* FLIP — restart the capture, leave the canvas stream + peer totally intact */
  const flip = async () => {
    const next: "user" | "environment" =
      facingRef.current === "user" ? "environment" : "user";
    facingRef.current = next;
    setFacing(next);
    if (status !== "live" && status !== "connecting") return;
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
      setLinkStatus("FLIP CAMERA FAILED");
    }
  };

  /* ---------------- pinch / drag / double-tap gestures ---------------- */
  const onTouchStart = (e: ReactTouchEvent) => {
    touchRef.current = Array.from(e.touches).map((tn) => ({
      id: tn.identifier,
      x: tn.clientX,
      y: tn.clientY,
    }));
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
        <div className="font-body text-[11px] font-bold tracking-[0.4em] text-mag">
          STAGE BROADCAST CAM
        </div>
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
                if (status === "live" || status === "connecting") void goLive(q.id);
                else setQuality(q.id);
              }
            }}
            className={`border px-3 py-1 font-mono text-xs font-bold tracking-wider uppercase transition-colors ${
              quality === q.id
                ? "border-volt bg-volt text-court"
                : "border-ice/20 text-ice/60 hover:border-ice/40 hover:text-ice"
            }`}
          >
            {q.label}
          </button>
        ))}
        <button
          onClick={() => void flip()}
          className="ml-auto border border-mag/40 bg-mag/10 px-3 py-1 font-mono text-xs font-bold tracking-wider text-mag uppercase transition-colors hover:bg-mag hover:text-court"
        >
          FLIP ({facing === "user" ? "FRONT" : "REAR"})
        </button>
      </div>

      {/* viewport */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onDoubleClick={onDoubleTap}
        className="relative aspect-video w-full overflow-hidden border-2 border-ice/20 bg-black"
      >
        <video
          ref={srcVideoRef}
          playsInline
          muted
          autoPlay
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0"
        />
        <canvas ref={canvasRef} className="h-full w-full object-cover" />

        {/* HUD overlays */}
        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 font-mono text-[11px] font-bold tracking-wider">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              status === "live"
                ? "animate-ping bg-volt"
                : status === "connecting"
                ? "animate-pulse bg-[#ffd23f]"
                : "bg-mag"
            }`}
          />
          <span
            className={
              status === "live"
                ? "text-volt"
                : status === "connecting"
                ? "text-[#ffd23f]"
                : "text-mag"
            }
          >
            {linkStatus}
          </span>
        </div>

        {resBadge && (
          <div className="pointer-events-none absolute bottom-3 left-3 bg-black/80 px-2 py-0.5 font-mono text-[10px] text-ice/70">
            {resBadge}
          </div>
        )}

        {zoom > 1 && (
          <div className="pointer-events-none absolute bottom-3 right-3 bg-black/80 px-2 py-0.5 font-mono text-[10px] text-volt">
            {zoom.toFixed(1)}x ZOOM
          </div>
        )}
      </div>

      {/* zoom presets */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-ice/50">ZOOM</span>
        {[1, 1.5, 2, 3, 5].map((z) => (
          <button
            key={z}
            onClick={() => setZoomBoth(z)}
            className={`flex-1 border py-1.5 font-mono text-xs font-bold ${
              zoom === z
                ? "border-volt bg-volt text-court"
                : "border-ice/20 text-ice/60 hover:border-ice/40 hover:text-ice"
            }`}
          >
            {z}x
          </button>
        ))}
      </div>

      {/* go live / stop */}
      {status === "idle" || status === "error" ? (
        <button
          onClick={() => void goLive()}
          className="border-2 border-volt bg-volt py-4 font-display text-2xl uppercase tracking-wider text-court transition-transform active:scale-[0.98]"
        >
          START BROADCAST
        </button>
      ) : (
        <button
          onClick={stop}
          className="border-2 border-mag bg-mag/20 py-4 font-display text-2xl uppercase tracking-wider text-mag transition-transform active:scale-[0.98]"
        >
          STOP BROADCAST
        </button>
      )}

      {/* help text */}
      <footer className="mt-auto border-t border-ice/10 pt-4 font-mono text-[11px] text-ice/40">
        Pinch to zoom (1x–5x) · Drag to pan · Double-tap to reset.
        <br />
        Stream routes live to the stage screen via WebRTC.
      </footer>
    </main>
  );
}
