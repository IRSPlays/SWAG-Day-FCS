"use client";

/* CameraWindow — the STAGE-side half of the phone→stage WebRTC link.
   Listens for cam-offer / cam-ice from the phone, answers, and shows
   the remote video in a framed LIVE window. */

import { useEffect, useRef, useState } from "react";
import { getTransport } from "@/realtime/transport";
import { newEventId, type ShowEvent, type ShowEventInput } from "@/realtime/types";

const RTC_CFG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function CameraWindow() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [res, setRes] = useState("");

  useEffect(() => {
    const t = getTransport();
    let pc: RTCPeerConnection | null = null;

    const send = (e: ShowEventInput) =>
      t.publish({ ...e, id: newEventId(), ts: Date.now() } as ShowEvent);

    const ensurePc = () => {
      pc?.close();
      pc = new RTCPeerConnection(RTC_CFG);
      pc.ontrack = (e) => {
        if (videoRef.current) videoRef.current.srcObject = e.streams[0];
      };
      pc.onicecandidate = (e) => {
        if (e.candidate)
          send({ type: "cam-ice", from: "stage", candidate: e.candidate.toJSON() });
      };
      return pc;
    };

    const unsub = t.subscribe(async (ev) => {
      if (ev.type === "cam-offer") {
        const conn = ensurePc();
        try {
          await conn.setRemoteDescription(ev.sdp);
          const answer = await conn.createAnswer();
          await conn.setLocalDescription(answer);
          send({ type: "cam-answer", sdp: answer });
        } catch {
          /* phone went away */
        }
      } else if (ev.type === "cam-ice" && ev.from === "phone" && pc) {
        try {
          await pc.addIceCandidate(ev.candidate);
        } catch {
          /* trickle race */
        }
      }
    });

    // invite any live phone to connect, and keep inviting
    send({ type: "cam-request" });
    const hb = setInterval(() => send({ type: "cam-request" }), 4000);

    return () => {
      clearInterval(hb);
      unsub();
      pc?.close();
    };
  }, []);

  return (
    <div className="absolute right-8 top-8 z-40 w-[430px] border-4 border-mag bg-court shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
      <div className="flex items-center justify-between bg-mag px-4 py-2">
        <span className="flex items-center gap-2 font-body text-[15px] font-bold tracking-[0.3em] text-ice">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-ice" />
          STAGE CAM
        </span>
        <span className="font-body text-[13px] font-bold tracking-[0.25em] text-ice/85">
          {res || "LIVE"}
        </span>
      </div>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          if (v.videoWidth > 0) setRes(`${v.videoWidth}×${v.videoHeight}`);
        }}
        className="aspect-video w-full bg-black object-cover"
      />
    </div>
  );
}
