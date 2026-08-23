"use client";

/* CameraWindow — the STAGE-side hub of the multi-camera WebRTC broadcast system.
   Supports smooth animated transitions:
   - "hidden": slides down off the bottom of the stage screen
   - "pip": bottom slide-up Picture-in-Picture window (540px 16:9)
   - "fullscreen": full-bleed stage broadcast covering the whole projector
   WebRTC connections stay permanently hot in the background for zero-latency cutting. */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  const camLayout = useShow((s) => s.camLayout ?? "pip");
  const activeCam = useShow((s) => s.activeCam);
  const cams = useShow((s) => s.cams);
  const arenaRef = useRef<HTMLDivElement>(null);
  const peersRef = useRef<Map<string, CamPeer>>(new Map());
  const [res, setRes] = useState("");
  const [stats, setStats] = useState("");

  /* live network diagnostics for the camera on stage */
  useEffect(() => {
    if (!activeCam) {
      setStats("");
      return;
    }
    let lastBytes = 0;
    let lastTs = 0;
    const iv = setInterval(() => {
      const p = peersRef.current.get(activeCam);
      if (!p?.pc) {
        setStats("");
        return;
      }
      void p.pc.getStats().then((s) => {
        let rtt = 0,
          jitter = 0,
          fps = 0,
          loss = 0,
          mbps = 0;
        s.forEach((r) => {
          const rep = r as unknown as Record<string, unknown>;
          if (
            rep.type === "candidate-pair" &&
            rep.nominated &&
            typeof rep.currentRoundTripTime === "number"
          )
            rtt = Math.round(rep.currentRoundTripTime * 1000);
          if (rep.type === "inbound-rtp" && rep.kind === "video") {
            if (typeof rep.jitter === "number") jitter = Math.round(rep.jitter * 1000);
            if (typeof rep.framesPerSecond === "number") fps = Math.round(rep.framesPerSecond);
            if (typeof rep.packetsLost === "number") loss = rep.packetsLost;
            const b = typeof rep.bytesReceived === "number" ? rep.bytesReceived : 0;
            const t = typeof rep.timestamp === "number" ? rep.timestamp : 0;
            if (lastTs && t > lastTs)
              mbps = +(((b - lastBytes) * 8) / ((t - lastTs) * 1000)).toFixed(1);
            lastBytes = b;
            lastTs = t;
          }
        });
        setStats(
          `${rtt}ms · ${mbps} Mb/s · ${fps}fps · jit ${jitter}ms${loss > 0 ? ` · lost ${loss}` : ""}`
        );
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [activeCam, cams]);

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
        try {
          (e.receiver as RTCRtpReceiver & { playoutDelayHint?: number }).playoutDelayHint = 0;
        } catch {
          /* unsupported */
        }
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
          const peer = peersRef.current.get(ev.camId);
          peer?.pc?.close();
          peer?.video?.remove();
          peersRef.current.delete(ev.camId);
          dispatch({ type: "cam-bye", camId: ev.camId });
          break;
        }
        case "cam-offer": {
          const pc = ensurePc(ev.camId);
          const peer = peersRef.current.get(ev.camId);
          const offerStr = JSON.stringify(ev.sdp);
          if (peer?.answeredOffer === offerStr) return;
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(ev.sdp));
            const ans = await pc.createAnswer();
            await pc.setLocalDescription(ans);
            if (peer) peer.answeredOffer = offerStr;
            send({ type: "cam-answer", camId: ev.camId, sdp: ans });
          } catch (err) {
            console.error("CameraWindow: offer failed", err);
          }
          break;
        }
        case "cam-ice": {
          if (ev.from === "phone") {
            const peer = peersRef.current.get(ev.camId);
            if (peer?.pc && ev.candidate) {
              try {
                await peer.pc.addIceCandidate(new RTCIceCandidate(ev.candidate));
              } catch {
                /* candidate queue dropped */
              }
            }
          }
          break;
        }
      }
    });

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

  /* cut the selected camera into the visible window */
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

  const on = cameraOn && !!activeCam && !!cams[activeCam] && camLayout !== "hidden";
  const waiting = on && !cams[activeCam!]?.live;
  const isFullscreen = on && camLayout === "fullscreen";

  return (
    <motion.div
      initial={false}
      animate={
        isFullscreen
          ? {
              opacity: 1,
              scale: 1,
              x: 0,
              y: 0,
              width: "100%",
              height: "100%",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              borderRadius: 0,
            }
          : on
          ? {
              opacity: 1,
              scale: 1,
              x: 0,
              y: 0,
              width: "560px",
              height: "auto",
              top: "auto",
              right: "32px",
              bottom: "32px",
              left: "auto",
              borderRadius: "16px",
            }
          : {
              opacity: 0,
              scale: 0.9,
              x: 0,
              y: 120,
              width: "560px",
              height: "auto",
              top: "auto",
              right: "32px",
              bottom: "32px",
              left: "auto",
              borderRadius: "16px",
            }
      }
      transition={{ type: "spring", stiffness: 260, damping: 26, mass: 0.8 }}
      className={`fixed z-50 overflow-hidden border-4 border-mag bg-court shadow-[0_30px_90px_rgba(0,0,0,0.85)] ${
        on ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {/* header bar */}
      <div className="flex items-center justify-between bg-mag px-5 py-2.5">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span
              className={`absolute inline-flex h-full w-full rounded-full ${
                waiting ? "bg-ice/40" : "animate-ping bg-ice opacity-75"
              }`}
            />
            <span
              className={`relative inline-flex h-3 w-3 rounded-full ${
                waiting ? "bg-ice/50" : "bg-ice"
              }`}
            />
          </span>
          <span className="font-display text-lg font-black uppercase tracking-wider text-court">
            FLOOR BROADCAST{activeCam && cams[activeCam] ? ` · ${cams[activeCam].name}` : ""}
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[12px] font-bold text-court">
          <span>{waiting ? "AWAITING STREAM" : res || "LIVE 1080P"}</span>
          <span className="border border-court/30 px-2 py-0.5 uppercase tracking-widest">
            {isFullscreen ? "FULL SCREEN" : "PIP"}
          </span>
        </div>
      </div>

      {/* live network stats banner */}
      {stats && !waiting && !isFullscreen && (
        <div className="bg-black/90 px-4 py-1 font-mono text-[11px] font-semibold text-ice/70">
          LINK: {stats}
        </div>
      )}

      {/* video viewport arena */}
      <div
        ref={arenaRef}
        className={`relative w-full overflow-hidden bg-black ${
          isFullscreen ? "h-[calc(100%-48px)]" : "aspect-video"
        }`}
      />

      {waiting && (
        <div className="absolute inset-0 grid place-items-center bg-black/75">
          <div className="text-center">
            <div className="font-display text-3xl uppercase tracking-widest text-volt">
              CONNECTING TO FLOOR CAM
            </div>
            <div className="mt-1 font-mono text-xs text-ice/50">
              Open /camera on a mobile device and ensure camera permissions are active
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
