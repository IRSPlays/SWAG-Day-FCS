"use client";

/* /camera — a phone becomes one of SEVERAL live cameras for the stage screen.
   WebRTC peer connection; the show transport carries the signaling.
   The PHONE is always the offerer; the stage answers. Negotiation is
   self-healing: on ICE failure or an unanswered offer the peer connection
   is rebuilt and re-offered automatically.
   A diagnostics HUD exposes the whole handshake so stalls are observable
   on-device instead of invisible. */

import { useEffect, useRef, useState, type TouchEvent as ReactTouchEvent } from "react";
import { getTransport } from "@/realtime/transport";
import { newEventId, type ShowEvent, type ShowEventInput } from "@/realtime/types";

const RTC_CFG: RTCConfiguration = {
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
    { urls: ["stun:stun2.l.google.com:19302", "stun:stun3.l.google.com:19302"] },
    { urls: ["stun:stun.cloudflare.com:3478"] },
  ],
  iceCandidatePoolSize: 10,
};

const QUALITIES = [
  { id: "720p", label: "720p", w: 1280, h: 720, mbps: 2.5 },
  { id: "1080p", label: "1080p", w: 1920, h: 1080, mbps: 5 },
  { id: "1440p", label: "1440p", w: 2560, h: 1440, mbps: 9 },
] as const;
type QualityId = (typeof QUALITIES)[number]["id"];

const ZOOM_MAX = 5;
const REOFFER_COOLDOWN_MS = 8000; /* min gap between offer attempts */
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

interface Diag {
  link: string;
  pc: string;
  ice: string;
  offers: number;
  answers: number;
  iceOut: number;
  iceIn: number;
  queued: number;
}

export default function CameraPage() {
  const [status, setStatus] = useState<"idle" | "connecting" | "live" | "error">("idle");
  const [quality, setQuality] = useState<QualityId>("1080p");
  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [resBadge, setResBadge] = useState("");
  const [diag, setDiag] = useState<Diag>({
    link: "-",
    pc: "-",
    ice: "-",
    offers: 0,
    answers: 0,
    iceOut: 0,
    iceIn: 0,
    queued: 0,
  });

  const camIdRef = useRef("");
  const srcVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cStreamRef = useRef<MediaStream | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const rafRef = useRef(0);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const negotiatingRef = useRef(false);
  const lastAttemptRef = useRef(0);
  const answeredRef = useRef(false);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const cStreamRefForPc = useRef<MediaStream | null>(null);

  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const facingRef = useRef<"user" | "environment">("environment");

  const touchRef = useRef<{ id: number; x: number; y: number }[]>([]);
  const gestureRef = useRef({ dist: 0, mid: { x: 0, y: 0 } });

  const send = (e: ShowEventInput) =>
    getTransport().publish({ ...e, id: newEventId(), ts: Date.now() } as ShowEvent);

  const patchDiag = (p: Partial<Diag>) => setDiag((d) => ({ ...d, ...p }));

  /* live link status - SERVER the moment WS or the HTTP fallback connects */
  useEffect(() => {
    const t = getTransport();
    patchDiag({ link: t.kind });
    return t.onStatus((kind) => patchDiag({ link: kind }));
  }, []);

  const setZoomBoth = (v: number) => {
    const z = clamp(v, 1, ZOOM_MAX);
    zoomRef.current = z;
    setZoom(z);
  };

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

  const sendOffer = async () => {
    const pc = pcRef.current;
    const camId = camIdRef.current;
    if (!pc || !camId) return;
    if (negotiatingRef.current || pc.signalingState !== "stable") return;
    try {
      negotiatingRef.current = true;
      lastAttemptRef.current = Date.now();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      patchDiag({ offers: diag.offers + 1 });
      send({ type: "cam-offer", camId, sdp: offer });
    } catch (err) {
      console.warn("createOffer failed:", err);
    } finally {
      negotiatingRef.current = false;
    }
  };

  /* build (or rebuild) the peer connection around the current canvas track */
  const buildPc = () => {
    const cTrack = trackRef.current;
    const cStream = cStreamRefForPc.current;
    if (!cTrack || !cStream) return;

    pcRef.current?.close();
    pendingIceRef.current = [];
    answeredRef.current = false;

    const pc = new RTCPeerConnection(RTC_CFG);
    pcRef.current = pc;

    try {
      pc.addTransceiver(cTrack, {
        direction: "sendonly",
        streams: [cStream],
        sendEncodings: [{ maxBitrate: 5_000_000, maxFramerate: 30 }],
      });
    } catch {
      pc.addTrack(cTrack, cStream);
    }
    try {
      cTrack.contentHint = "motion";
    } catch {}

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        patchDiag({ iceOut: diag.iceOut + 1 });
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
      patchDiag({ pc: s });
      if (s === "connected") setStatus("live");
      if (s === "failed") {
        /* self-heal: rebuild the peer and re-offer on the next heartbeat */
        setStatus("connecting");
        buildPc();
        void sendOffer();
      }
    };

    pc.oniceconnectionstatechange = () => {
      patchDiag({ ice: pc.iceConnectionState });
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        setStatus("live");
      }
    };

    patchDiag({ pc: pc.connectionState, ice: pc.iceConnectionState, queued: 0 });
  };

  const goLive = async (pick: QualityId = quality) => {
    try {
      stop();
      setStatus("connecting");
      const camId = `cam-${Math.random().toString(36).slice(2, 9)}`;
      camIdRef.current = camId;
      setQuality(pick);
      const q = QUALITIES.find((x) => x.id === pick)!;

      await grabCamera(facingRef.current, q);
      if (!canvasRef.current) throw new Error("no canvas");

      let cStream: MediaStream;
      try {
        cStream = canvasRef.current.captureStream(30);
        if (!cStream.getVideoTracks().length) throw new Error("empty canvas stream");
      } catch {
        cStream = streamRef.current!.clone();
      }
      cStreamRef.current = cStream;
      cStreamRefForPc.current = cStream;
      trackRef.current = cStream.getVideoTracks()[0];

      buildPc();

      const t = getTransport();
      unsubRef.current = t.subscribe(async (ev) => {
        const pc = pcRef.current;
        if (!pc) return;

        if (ev.type === "cam-request") {
          /* heartbeat: only re-offer when the last attempt is stale —
             never churn renegotiation while one is in flight */
          if (pc.connectionState === "connected") return;
          if (negotiatingRef.current || pc.signalingState !== "stable") return;
          if (Date.now() - lastAttemptRef.current < REOFFER_COOLDOWN_MS) return;
          await sendOffer();
        } else if (ev.type === "cam-answer") {
          if (ev.camId !== camIdRef.current) return;
          if (pc.signalingState !== "have-local-offer") return;
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(ev.sdp));
            answeredRef.current = true;
            patchDiag({ answers: diag.answers + 1 });
            const queued = pendingIceRef.current;
            pendingIceRef.current = [];
            patchDiag({ queued: 0 });
            for (const c of queued) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(c));
              } catch (e) {
                console.warn("queued addIceCandidate:", e);
              }
            }
          } catch (err) {
            console.warn("apply answer failed:", err);
          }
        } else if (ev.type === "cam-ice" && ev.from === "stage") {
          if (ev.camId !== camIdRef.current) return;
          patchDiag({ iceIn: diag.iceIn + 1 });
          if (pc.remoteDescription && pc.remoteDescription.type) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(ev.candidate));
            } catch (e) {
              console.warn("addIceCandidate:", e);
            }
          } else {
            pendingIceRef.current.push(ev.candidate);
            patchDiag({ queued: pendingIceRef.current.length });
          }
        }
      });

      rafRef.current = requestAnimationFrame(drawLoop);

      /* announce + offer immediately; the serialized transport keeps
         offer-before-ICE ordering intact end to end */
      send({ type: "cam-hello", camId });
      await sendOffer();
    } catch (err) {
      console.error("goLive failed:", err);
      stop();
      setStatus("error");
    }
  };

  const stop = () => {
    if (camIdRef.current) send({ type: "cam-bye", camId: camIdRef.current });
    cancelAnimationFrame(rafRef.current);
    unsubRef.current?.();
    pcRef.current?.close();
    pcRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    cStreamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    cStreamRef.current = null;
    cStreamRefForPc.current = null;
    trackRef.current = null;
    pendingIceRef.current = [];
    if (srcVideoRef.current) srcVideoRef.current.srcObject = null;
    camIdRef.current = "";
    setResBadge("");
    setStatus("idle");
    setDiag({ link: "-", pc: "-", ice: "-", offers: 0, answers: 0, iceOut: 0, iceIn: 0, queued: 0 });
  };

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
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 bg-court px-5 py-6 text-ice">
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
            className={`border px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
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
          className="ml-auto border border-mag/40 bg-mag/10 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-mag transition-colors hover:bg-mag hover:text-court"
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
          <span className={status === "live" ? "text-volt" : status === "connecting" ? "text-[#ffd23f]" : "text-mag"}>
            {status === "live" ? "ON AIR" : status === "connecting" ? "CONNECTING" : status === "error" ? "ERROR" : "IDLE"}
          </span>
        </div>

        {resBadge && (
          <div className="pointer-events-none absolute bottom-3 left-3 bg-black/80 px-2 py-0.5 font-mono text-[10px] text-ice/70">
            {resBadge}
          </div>
        )}

        {zoom > 1 && (
          <div className="pointer-events-none absolute bottom-3 right-3 bg-black/80 px-2 py-0.5 font-mono text-[10px] text-volt">
            {zoom.toFixed(1)}x
          </div>
        )}
      </div>

      {/* signaling diagnostics — makes every handshake stage observable */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 border border-ice/15 bg-panel/60 px-4 py-3 font-mono text-[10px] tracking-wider text-ice/70">
        <div className="flex justify-between">
          <span className="text-ice/40">LINK</span>
          <span className={diag.link === "server" ? "text-volt" : "text-[#ffd23f]"}>{diag.link.toUpperCase()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ice/40">PEER</span>
          <span className={diag.pc === "connected" ? "text-volt" : "text-ice"}>{diag.pc}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ice/40">ICE</span>
          <span className={diag.ice === "connected" || diag.ice === "completed" ? "text-volt" : diag.ice === "failed" ? "text-mag" : "text-ice"}>
            {diag.ice}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-ice/40">OFFERS</span>
          <span className="text-ice">{diag.offers}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ice/40">ANSWERS</span>
          <span className={diag.answers > 0 ? "text-volt" : "text-[#ffd23f]"}>{diag.answers}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ice/40">ICE ↑↓</span>
          <span className="text-ice">
            {diag.iceOut}/{diag.iceIn}
          </span>
        </div>
        <div className="col-span-2 flex justify-between">
          <span className="text-ice/40">QUEUED CANDIDATES</span>
          <span className={diag.queued > 0 ? "text-[#ffd23f]" : "text-volt"}>{diag.queued}</span>
        </div>
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

      <footer className="mt-auto border-t border-ice/10 pt-3 font-mono text-[10px] leading-relaxed text-ice/40">
        Pinch to zoom · drag to pan · double-tap resets.
        <br />
        ICE stuck at "checking" = network blocks peer-to-peer (client isolation / cellular NAT) — join the same Wi-Fi as the stage.
      </footer>
    </main>
  );
}
