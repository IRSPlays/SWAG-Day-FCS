"use client";

/* /camera — a phone becomes one of SEVERAL live cameras for the stage screen.
   WebRTC peer connections; the show transport carries the signaling.
   The PHONE is always the offerer; every viewer answers:
   - "stage"      → the projector machine (CameraWindow)
   - "ops-…"      → /camera-ops multiview tiles
   Offers carry to:<viewerId>, answers/ICE carry from:<viewerId> — so each
   viewer gets its own peer connection without crosstalk.

   Thermal notes (why this page stays cool for hours):
   - The canvas repaints via requestVideoFrameCallback — only when the
     camera actually delivers a frame (~30fps), NOT at display refresh rate
     (60-120Hz rAF painting 1920x1080 = GPU burn = throttle = lag creep).
   - Encode bitrate follows the selected quality, not one fixed value. */

import { useEffect, useRef, useState, type TouchEvent as ReactTouchEvent } from "react";
import { getTransport } from "@/realtime/transport";
import { newEventId, type ShowEvent, type ShowEventInput } from "@/realtime/types";
import { iceServers } from "@/realtime/rtc";

const QUALITIES = [
  { id: "720p", label: "720p", w: 1280, h: 720, mbps: 2.5 },
  { id: "1080p", label: "1080p", w: 1920, h: 1080, mbps: 5 },
] as const;
type QualityId = (typeof QUALITIES)[number]["id"];

const ZOOM_MAX = 5;
const REOFFER_COOLDOWN_MS = 8000; /* min gap between re-offers, PER viewer */
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

interface ViewerPc {
  pc: RTCPeerConnection;
  negotiating: boolean;
  lastAttempt: number;
}

interface Diag {
  link: string;
  viewers: number;   /* viewers with a connected peer */
  offers: number;
  answers: number;
  iceOut: number;
  iceIn: number;
}

export default function CameraPage() {
  const [status, setStatus] = useState<"idle" | "connecting" | "live" | "error">("idle");
  const [quality, setQuality] = useState<QualityId>("720p");
  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [resBadge, setResBadge] = useState("");
  const [diag, setDiag] = useState<Diag>({
    link: "-",
    viewers: 0,
    offers: 0,
    answers: 0,
    iceOut: 0,
    iceIn: 0,
  });

  const camIdRef = useRef("");
  const srcVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cStreamRef = useRef<MediaStream | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  /* one peer connection per viewer */
  const peersRef = useRef<Map<string, ViewerPc>>(new Map());
  const unsubRef = useRef<(() => void) | null>(null);

  /* frame-driven paint scheduling */
  const paintScheduledRef = useRef(false);
  const paintTimerRef = useRef(0);

  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const facingRef = useRef<"user" | "environment">("environment");

  const touchRef = useRef<{ id: number; x: number; y: number }[]>([]);
  const gestureRef = useRef({ dist: 0, mid: { x: 0, y: 0 } });

  const send = (e: ShowEventInput) =>
    getTransport().publish({ ...e, id: newEventId(), ts: Date.now() } as ShowEvent);

  const patchDiag = (p: Partial<Diag>) => setDiag((d) => ({ ...d, ...p }));

  /* live link status */
  useEffect(() => {
    const t = getTransport();
    patchDiag({ link: t.kind });
    return t.onStatus((kind) => patchDiag({ link: kind }));
  }, []);

  /* count how many viewer peers are actually carrying media */
  useEffect(() => {
    if (status !== "live" && status !== "connecting") return;
    const iv = setInterval(() => {
      let connected = 0;
      peersRef.current.forEach((v) => {
        if (v.pc.connectionState === "connected") connected += 1;
      });
      patchDiag({ viewers: connected });
    }, 1000);
    return () => clearInterval(iv);
  }, [status]);

  const setZoomBoth = (v: number) => {
    const z = clamp(v, 1, ZOOM_MAX);
    zoomRef.current = z;
    setZoom(z);
  };

  /* -------- paint ONLY when the camera delivers a new frame --------
     rVFC fires at the camera's native cadence (~30fps). A 1s fallback timer
     covers browsers without requestVideoFrameCallback. This single change
     is what stops the phone cooking itself on a long broadcast. */
  const paintFrame = () => {
    paintScheduledRef.current = false;
    const canvas = canvasRef.current;
    const video = srcVideoRef.current;
    if (!canvas || !video || video.videoWidth === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const z = zoomRef.current;
    const scale = Math.max(W / video.videoWidth, H / video.videoHeight) * z;
    const dw = video.videoWidth * scale;
    const dh = video.videoHeight * scale;
    const ox = (W - dw) / 2 + (panRef.current.x * (W - dw)) / 2;
    const oy = (H - dh) / 2 + (panRef.current.y * (H - dh)) / 2;
    /* clear only when letterboxed (zoom < cover); else redraw covers all */
    if (ox > 0 || oy > 0 || dw < W || dh < H) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
    }
    ctx.drawImage(video, ox, oy, dw, dh);
  };

  const schedulePaint = () => {
    if (paintScheduledRef.current) return;
    paintScheduledRef.current = true;
    const v = srcVideoRef.current as
      | (HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => number })
      | null;
    if (v && typeof v.requestVideoFrameCallback === "function") {
      v.requestVideoFrameCallback(() => {
        paintFrame();
        schedulePaint(); /* keep the chain alive — still frame-driven */
      });
    } else {
      /* fallback: ~30fps timer instead of display-rate rAF */
      paintTimerRef.current = window.setTimeout(() => {
        paintFrame();
        schedulePaint();
      }, 33);
    }
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

  /* ---- per-viewer peer management ---- */

  const buildViewerPc = (viewer: string): ViewerPc | null => {
    const track = trackRef.current;
    const stream = cStreamRef.current;
    if (!track || !stream) return null;

    const old = peersRef.current.get(viewer);
    old?.pc.close();

    const pc = new RTCPeerConnection({ iceServers: iceServers(), iceCandidatePoolSize: 10 });

    const maxBitrate = Math.round(QUALITIES.find((x) => x.id === quality)!.mbps * 1_000_000);
    try {
      pc.addTransceiver(track, {
        direction: "sendonly",
        streams: [stream],
        sendEncodings: [{ maxBitrate, maxFramerate: 30 }],
      });
    } catch {
      pc.addTrack(track, stream);
    }

    const entry: ViewerPc = { pc, negotiating: false, lastAttempt: 0 };
    peersRef.current.set(viewer, entry);

    pc.onicecandidate = (e) => {
      if (!e.candidate) return;
      setDiag((d) => ({ ...d, iceOut: d.iceOut + 1 }));
      send({
        type: "cam-ice",
        from: "phone",
        camId: camIdRef.current,
        candidate: e.candidate.toJSON(),
        to: viewer,
      });
    };

    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === "connected") setStatus("live");
      if (s === "failed") {
        /* tear down; the next heartbeat re-offers fresh */
        pc.close();
        if (peersRef.current.get(viewer)?.pc === pc) peersRef.current.delete(viewer);
        setStatus("connecting");
      }
    };

    return entry;
  };

  const sendOfferTo = async (viewer: string) => {
    const camId = camIdRef.current;
    if (!camId) return;
    const existing = peersRef.current.get(viewer);
    const entry = existing ?? buildViewerPc(viewer);
    if (!entry) return;
    const pc = entry.pc;
    if (entry.negotiating || pc.signalingState !== "stable") return;
    if (pc.connectionState === "connected") return;
    if (Date.now() - entry.lastAttempt < REOFFER_COOLDOWN_MS) return;

    try {
      entry.negotiating = true;
      entry.lastAttempt = Date.now();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      setDiag((d) => ({ ...d, offers: d.offers + 1 }));
      send({ type: "cam-offer", camId, sdp: offer, to: viewer });
    } catch (err) {
      console.warn(`createOffer (${viewer}) failed:`, err);
    } finally {
      entry.negotiating = false;
    }
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
      trackRef.current = cStream.getVideoTracks()[0];
      try {
        trackRef.current.contentHint = "motion";
      } catch {}

      const t = getTransport();
      unsubRef.current = t.subscribe(async (ev) => {
        const camId = camIdRef.current;
        if (!camId) return;

        if (ev.type === "cam-request") {
          const viewer = ev.from ?? "stage";
          await sendOfferTo(viewer);
          return;
        }
        if (ev.type === "cam-answer") {
          /* answers come back tagged from=<viewer>; apply to that peer only */
          const viewer = ev.from ?? "stage";
          if ((ev.to ?? camId) !== camId) return;
          const entry = peersRef.current.get(viewer);
          if (!entry) return;
          const pc = entry.pc;
          if (pc.signalingState !== "have-local-offer") return;
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(ev.sdp));
            setDiag((d) => ({ ...d, answers: d.answers + 1 }));
          } catch (err) {
            console.warn(`apply answer (${viewer}) failed:`, err);
          }
          return;
        }
        if (ev.type === "cam-ice") {
          /* viewer candidates arrive tagged from=<viewerId>; route by that */
          if (ev.from === "phone") return; /* our own echo */
          const entry = peersRef.current.get(ev.from);
          if (!entry) return;
          setDiag((d) => ({ ...d, iceIn: d.iceIn + 1 }));
          try {
            await entry.pc.addIceCandidate(new RTCIceCandidate(ev.candidate));
          } catch (e) {
            console.warn(`addIceCandidate (${ev.from}):`, e);
          }
        }
      });

      /* start painting frame-driven */
      schedulePaint();

      /* announce + offer to the stage immediately; other viewers (ops tiles)
         get offers via their own heartbeat cam-request → sendOfferTo(viewer) */
      send({ type: "cam-hello", camId });
      await sendOfferTo("stage");
    } catch (err) {
      console.error("goLive failed:", err);
      stop();
      setStatus("error");
    }
  };

  const stop = () => {
    if (camIdRef.current) send({ type: "cam-bye", camId: camIdRef.current });
    clearTimeout(paintTimerRef.current);
    paintScheduledRef.current = false;
    unsubRef.current?.();
    unsubRef.current = null;
    peersRef.current.forEach((v) => v.pc.close());
    peersRef.current.clear();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    cStreamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    cStreamRef.current = null;
    trackRef.current = null;
    if (srcVideoRef.current) srcVideoRef.current.srcObject = null;
    camIdRef.current = "";
    setResBadge("");
    setStatus("idle");
    setDiag({ link: diag.link, viewers: 0, offers: 0, answers: 0, iceOut: 0, iceIn: 0 });
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
      const mid = {
        x: (a.clientX + b.clientX) / 2,
        y: (a.clientY + b.clientY) / 2,
      };
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
    const onPageHide = () => {
      const camId = camIdRef.current;
      if (!camId) return;
      navigator.sendBeacon(
        "/api/ws-send",
        JSON.stringify({ type: "cam-bye", camId, id: newEventId(), ts: Date.now() })
      );
    };
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      clearTimeout(paintTimerRef.current);
      unsubRef.current?.();
      peersRef.current.forEach((v) => v.pc.close());
      peersRef.current.clear();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      cStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="page-light mx-auto flex min-h-screen max-w-md flex-col gap-4 bg-court px-5 py-6 text-ice">
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
              quality === q.id ? "border-volt bg-volt text-court" : "border-ice/20 text-ice/60"
            }`}
          >
            {q.label}
          </button>
        ))}
        <button
          onClick={() => void flip()}
          className="ml-auto border border-mag/40 bg-mag/10 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-mag"
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

        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 font-mono text-[11px] font-bold">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              status === "live"
                ? "animate-ping bg-volt"
                : status === "connecting"
                ? "animate-pulse bg-[#e1811f]"
                : "bg-mag"
            }`}
          />
          <span
            className={
              status === "live"
                ? "text-volt"
                : status === "connecting"
                ? "text-[#eeeded]"
                : "text-mag"
            }
          >
            {status === "live"
              ? `ON AIR · ${diag.viewers} VIEWER${diag.viewers === 1 ? "" : "S"}`
              : status === "connecting"
              ? "CONNECTING"
              : status === "error"
              ? "ERROR"
              : "IDLE"}
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

      {/* compact diagnostics */}
      <div className="grid grid-cols-3 gap-x-3 gap-y-1 border border-ice/15 bg-panel/60 px-4 py-3 font-mono text-[10px] tracking-wider text-ice/70">
        <span className="text-ice/40">LINK</span>
        <span className={diag.link === "server" ? "text-volt" : "text-[#eeeded]"}>
          {diag.link.toUpperCase()}
        </span>
        <span className={diag.viewers > 0 ? "text-volt" : "text-ice"}>
          {diag.viewers} LIVE
        </span>
        <span className="text-ice/40">OFFERS</span>
        <span>{diag.offers}</span>
        <span className={diag.answers > 0 ? "text-volt" : "text-[#eeeded]"}>
          ANS {diag.answers}
        </span>
        <span className="text-ice/40">ICE ↑↓</span>
        <span>
          {diag.iceOut}/{diag.iceIn}
        </span>
        <span />
      </div>

      {/* zoom presets */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-ice/50">ZOOM</span>
        {[1, 1.5, 2, 3, 5].map((z) => (
          <button
            key={z}
            onClick={() => setZoomBoth(z)}
            className={`flex-1 border py-1.5 font-mono text-xs font-bold ${
              zoom === z ? "border-volt bg-volt text-court" : "border-ice/20 text-ice/60"
            }`}
          >
            {z}x
          </button>
        ))}
      </div>

      {status === "idle" || status === "error" ? (
        <button
          onClick={() => void goLive()}
          className="border-2 border-volt bg-volt py-4 font-display text-2xl uppercase tracking-wider text-court active:scale-[0.98]"
        >
          START BROADCAST
        </button>
      ) : (
        <button
          onClick={stop}
          className="border-2 border-mag bg-mag/20 py-4 font-display text-2xl uppercase tracking-wider text-mag active:scale-[0.98]"
        >
          STOP BROADCAST
        </button>
      )}

      <footer className="mt-auto border-t border-ice/10 pt-3 font-mono text-[10px] leading-relaxed text-ice/40">
        Pinch to zoom · drag to pan · double-tap resets.
        <br />
        Viewers connect independently — stage + ops console can watch simultaneously.
      </footer>
    </main>
  );
}
