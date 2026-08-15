"use client";

/* /camera — a phone becomes a live camera for the stage screen.
   WebRTC peer connection; the show transport carries the signaling.
   Video only (no audio) — the PA stays with the stage machine. */

import { useEffect, useRef, useState } from "react";
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
  { id: "720p", label: "720p · balanced", w: 1280, h: 720, mbps: 2.5 },
  { id: "1080p", label: "1080p · HD", w: 1920, h: 1080, mbps: 5 },
  { id: "1440p", label: "1440p · QHD", w: 2560, h: 1440, mbps: 9 },
] as const;
type QualityId = (typeof QUALITIES)[number]["id"];

export default function CameraPage() {
  const [status, setStatus] = useState<"idle" | "live" | "error">("idle");
  const [quality, setQuality] = useState<QualityId>("1440p");
  const [resBadge, setResBadge] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  const send = (e: ShowEventInput) =>
    getTransport().publish({ ...e, id: newEventId(), ts: Date.now() } as ShowEvent);

  const stop = () => {
    unsubRef.current?.();
    pcRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current = null;
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setResBadge("");
    setStatus("idle");
  };

  useEffect(() => stop, []);

  async function goLive(pick: QualityId = quality) {
    try {
      const q = QUALITIES.find((x) => x.id === pick)!;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          /* ideal lets weak cameras drop a tier instead of failing */
          width: { ideal: q.w },
          height: { ideal: q.h },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      /* show what the camera actually negotiated (often lower than ideal) */
      const caps = stream.getVideoTracks()[0]?.getSettings();
      if (caps?.width && caps?.height)
        setResBadge(
          `${caps.width}×${caps.height}${caps.frameRate ? ` @ ${Math.round(caps.frameRate)}fps` : ""}`,
        );

      const t = getTransport();
      const pc = new RTCPeerConnection(RTC_CFG);
      pcRef.current = pc;
      try {
        /* addTransceiver lets us pin the encoder budget BEFORE negotiation -
           the whole reason 1080p/1440p won't get bitrate-crushed */
        const tr = pc.addTransceiver(stream.getVideoTracks()[0], {
          streams: [stream],
          sendEncodings: [{ maxBitrate: q.mbps * 1_000_000, maxFramerate: 30 }],
        });
        /* encoder policy: keep the 30fps motion smooth and drop resolution
           (not framerate) when the network tightens - a live stage cam that
           stutters looks worse than one that softens slightly */
        const params = tr.sender.getParameters();
        if (params.degradationPreference !== "maintain-framerate") {
          params.degradationPreference = "maintain-framerate";
          tr.sender.setParameters(params).catch(() => {});
        }
      } catch {
        stream.getTracks().forEach((tr) => pc.addTrack(tr, stream));
      }
      pc.onicecandidate = (e) => {
        if (e.candidate)
          send({ type: "cam-ice", from: "phone", candidate: e.candidate.toJSON() });
      };

      unsubRef.current = t.subscribe(async (ev) => {
        if (ev.type === "cam-request") {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            send({ type: "cam-offer", sdp: offer });
          } catch {
            /* pc closed */
          }
        } else if (ev.type === "cam-answer") {
          try {
            await pc.setRemoteDescription(ev.sdp);
          } catch {
            /* stale */
          }
        } else if (ev.type === "cam-ice" && ev.from === "stage") {
          try {
            await pc.addIceCandidate(ev.candidate);
          } catch {
            /* race */
          }
        }
      });

      setStatus("live");
    } catch {
      setStatus("error");
    }
  }

  /* switch quality without leaving - tears down and re-streams in one tap */
  const pick = (id: QualityId) => {
    if (id === quality) return;
    const wasLive = status === "live";
    stop();
    setQuality(id);
    if (wasLive) void goLive(id);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 bg-court px-5 py-6 text-ice">
      <header>
        <div className="font-body text-[11px] font-bold tracking-[0.4em] text-mag">STAGE CAM</div>
        <h1 className="mt-1 font-display text-4xl uppercase leading-[0.9]">
          You&apos;re the <span className="text-volt">camera</span> now
        </h1>
      </header>

      {/* capture quality - switch live, no need to stop first */}
      <div className="grid grid-cols-3 gap-2">
        {QUALITIES.map((q) => (
          <button
            key={q.id}
            onClick={() => pick(q.id)}
            className={`border-2 py-2.5 font-body text-[11px] font-bold tracking-[0.18em] transition-colors ${
              quality === q.id
                ? "border-volt bg-volt/10 text-volt"
                : "border-ice/20 text-ice/50"
            }`}
          >
            {q.label}
          </button>
        ))}
      </div>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="aspect-video w-full border-2 border-ice/20 bg-black object-cover"
      />

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
              Streaming <span className="font-bold text-volt">{resBadge}</span> to the
              stage screen whenever the Tech Lead hits STAGE CAM.
            </>
          ) : (
            "You're streaming to the stage screen whenever the Tech Lead hits STAGE CAM."
          )}
        </p>
      )}
    </main>
  );
}
