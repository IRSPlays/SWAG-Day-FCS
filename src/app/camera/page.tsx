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

export default function CameraPage() {
  const [status, setStatus] = useState<"idle" | "live" | "error">("idle");
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
    setStatus("idle");
  };

  useEffect(() => stop, []);

  async function goLive() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      const t = getTransport();
      const pc = new RTCPeerConnection(RTC_CFG);
      pcRef.current = pc;
      stream.getTracks().forEach((tr) => pc.addTrack(tr, stream));
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

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 bg-court px-5 py-6 text-ice">
      <header>
        <div className="font-body text-[11px] font-bold tracking-[0.4em] text-mag">STAGE CAM</div>
        <h1 className="mt-1 font-display text-4xl uppercase leading-[0.9]">
          You&apos;re the <span className="text-volt">camera</span> now
        </h1>
      </header>

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
          You&apos;re streaming to the stage screen whenever the Tech Lead hits STAGE CAM.
        </p>
      )}
    </main>
  );
}
