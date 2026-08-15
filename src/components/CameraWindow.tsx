"use client";

/* CameraWindow — the STAGE-side hub of the multi-camera WebRTC farm.
   Every phone that goes live (cam-hello) gets an RTCPeerConnection answered
   in the background, so ALL cameras stay hot-ready on the projector PC. The
   Controller picks the broadcast source (cam-active); cutting is instant
   because every camera's frames were already flowing. */

import { useEffect, useRef, useState } from "react";
import { getTransport } from "@/realtime/transport";
import { newEventId, type ShowEvent, type ShowEventInput } from "@/realtime/types";
import { useShow } from "@/store/show";

const RTC_CFG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

interface CamPeer {
  pc: RTCPeerConnection | null;
  video: HTMLVideoElement | null;
  answeredOffer: string | null;
}

export default function CameraWindow() {
  const dispatch = useShow((s) => s.dispatch);
  const cameraOn = useShow((s) => s.cameraOn);
  const activeCam = useShow((s) => s.activeCam);
  const cams = useShow((s) => s.cams);
  const arenaRef = useRef<HTMLDivElement>(null);
  const peersRef = useRef<Map<string, CamPeer>>(new Map());
  const [res, setRes] = useState("");

  useEffect(() => {
    const t = getTransport();
    let alive = true;

    const send = (e: ShowEventInput) =>
      t.publish({ ...e, id: newEventId(), ts: Date.now() } as ShowEvent);

    const ensurePc = (camId: string): RTCPeerConnection => {
      const peer = peersRef.current.get(camId);
      if (peer?.pc && !["closed", "failed"].includes(peer.pc.connectionState))
        return peer.pc;

      const pc = new RTCPeerConnection(RTC_CFG);
      const video = document.createElement("video");
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      video.style.cssText =
        "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:none;background:#000;";
      arenaRef.current?.appendChild(video);

      pc.ontrack = (e) => {
        video.srcObject = e.streams[0];
        if (alive) dispatch({ type: "cam-status", camId, live: true });
      };
      pc.onicecandidate = (e) => {
        if (e.candidate)
          send({ type: "cam-ice", from: "stage", camId, candidate: e.candidate.toJSON() });
      };
      pc.onconnectionstatechange = () => {
        if (alive && ["disconnected", "failed", "closed"].includes(pc.connectionState)) {
          dispatch({ type: "cam-status", camId, live: false });
        }
      };
      peersRef.current.set(camId, { pc, video, answeredOffer: null });
      return pc;
    };

    const unsub = t.subscribe(async (ev) => {
      switch (ev.type) {
        case "cam-hello": {
          if (!useShow.getState().cams[ev.camId])
            dispatch({ type: "cam-hello", camId: ev.camId });
          if (!peersRef.current.has(ev.camId)) {
            peersRef.current.set(ev.camId, { pc: null, video: null, answeredOffer: null });
          }
          break;
        }
        case "cam-bye": {
          const p = peersRef.current.get(ev.camId);
          peersRef.current.delete(ev.camId);
          p?.video?.remove();
          p?.pc?.close();
          break;
        }
        case "cam-offer": {
          if (!useShow.getState().cams[ev.camId])
            dispatch({ type: "cam-hello", camId: ev.camId });
          const pc = ensurePc(ev.camId);
          const peer = peersRef.current.get(ev.camId)!;
          /* dedupe: the phone heartbeats cam-request, don't re-gesture */
          if (peer.answeredOffer === ev.sdp.sdp) break;
          peer.answeredOffer = ev.sdp.sdp ?? null;
          try {
            await pc.setRemoteDescription(ev.sdp);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            send({ type: "cam-answer", camId: ev.camId, sdp: answer });
          } catch {
            /* phone vanished mid-handshake */
          }
          break;
        }
        case "cam-ice": {
          if (ev.from !== "phone") break;
          const p = peersRef.current.get(ev.camId);
          if (!p?.pc || p.pc.connectionState === "closed") break;
          try {
            await p.pc.addIceCandidate(ev.candidate);
          } catch {
            /* trickle race */
          }
          break;
        }
      }
    });

    /* invite live phones + keep the welcome mat out (phones answer once) */
    send({ type: "cam-request" });
    const hb = setInterval(() => send({ type: "cam-request" }), 4000);

    return () => {
      alive = false;
      clearInterval(hb);
      unsub();
      peersRef.current.forEach((p) => {
        p.pc?.close();
        p.video?.remove();
      });
      peersRef.current.clear();
    };
  }, [dispatch]);

  /* cut the selected camera into the visible window - the frames were already
     arriving in the background, so this is a pure CSS swap (~0ms) */
  useEffect(() => {
    const active = activeCam ? cams[activeCam] : null;
    peersRef.current.forEach((p, camId) => {
      if (!p.video) return;
      const on = camId === activeCam && !!active;
      p.video.style.display = on ? "block" : "none";
      if (on) {
        if (p.video.videoWidth > 0) setRes(`${p.video.videoWidth}×${p.video.videoHeight}`);
        else setRes("");
      }
    });
  }, [activeCam, cams]);

  const on = cameraOn && !!activeCam && !!cams[activeCam];
  const waiting = on && !cams[activeCam!]?.live;

  /* ONE stable wrapper, always mounted — the per-camera <video> elements are
     appended imperatively into the arena, so the DOM must never be swapped.
     when no camera is cut to stage the wrapper is display:none; the hub keeps
     answering phones and their frames keep flowing (desktop Chrome keeps
     WebRTC tracks alive while hidden), so cutting in is still instant.
     no dimmed "standby" box — the window simply isn't there. */
  return (
    <div
      className={`absolute right-8 top-8 z-40 w-[430px] border-4 border-mag bg-court shadow-[0_20px_60px_rgba(0,0,0,0.7)] ${on ? "" : "hidden"}`}
    >
      <div className="flex items-center justify-between bg-mag px-4 py-2">
        <span className="flex items-center gap-2 font-body text-[14px] font-bold tracking-[0.3em] text-ice">
          <span
            className={`h-2.5 w-2.5 rounded-full ${waiting ? "bg-ice/50" : "animate-pulse bg-ice"}`}
          />
          STAGE CAM{activeCam && cams[activeCam] ? ` · ${cams[activeCam].name}` : ""}
        </span>
        <span className="font-body text-[13px] font-bold tracking-[0.25em] text-ice/85">
          {waiting ? "CONNECTING" : res || "LIVE"}
        </span>
      </div>
      <div ref={arenaRef} className="relative aspect-video w-full overflow-hidden bg-black" />
      {waiting && (
        <div className="absolute inset-0 grid place-items-center bg-black/60">
          <span className="font-body text-[12px] font-bold tracking-[0.3em] text-ice/70">
            AWAITING STREAM…
          </span>
        </div>
      )}
    </div>
  );
}