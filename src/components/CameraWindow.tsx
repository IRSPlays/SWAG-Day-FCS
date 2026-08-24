"use client";

/* CameraWindow — the STAGE-side hub of the multi-camera WebRTC broadcast system.
   Supports smooth animated transitions:
   - "hidden": slides down off the bottom of the stage screen
   - "pip": bottom slide-up Picture-in-Picture window (560px 16:9)
   - "fullscreen": full-bleed stage broadcast covering the whole projector
   WebRTC connections stay permanently hot in the background for zero-latency cutting. */

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { getTransport } from "@/realtime/transport";
import { newEventId, type ShowEvent, type ShowEventInput } from "@/realtime/types";
import { useShow } from "@/store/show";

const RTC_CFG: RTCConfiguration = {
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
    { urls: ["stun:stun2.l.google.com:19302", "stun:stun3.l.google.com:19302"] },
    { urls: ["stun:stun.cloudflare.com:3478"] },
    { urls: ["stun:stun.services.mozilla.com"] },
  ],
  iceCandidatePoolSize: 10,
};

interface CamPeer {
  pc: RTCPeerConnection;
  video: HTMLVideoElement;
  pendingCandidates: RTCIceCandidateInit[];
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

  /* live network diagnostics for active camera */
  useEffect(() => {
    if (!activeCam || !cams[activeCam]) {
      setStats("");
      return;
    }
    const iv = setInterval(() => {
      const p = peersRef.current.get(activeCam);
      if (!p?.pc || p.pc.connectionState !== "connected") {
        setStats("");
        return;
      }
      void p.pc.getStats().then((s) => {
        let fps = 0;
        let w = 0;
        let h = 0;
        let kbps = 0;
        let rtt = 0;
        s.forEach((report) => {
          if (report.type === "inbound-rtp" && report.kind === "video") {
            fps = report.framesPerSecond ?? fps;
            w = report.frameWidth ?? w;
            h = report.frameHeight ?? h;
            if (report.bytesReceived && report.timestamp) {
              kbps = Math.round((report.bytesReceived * 8) / 1000 / Math.max(1, (report.timestamp - (report.lastPacketReceivedTimestamp || report.timestamp - 1000)) / 1000));
            }
          } else if (report.type === "candidate-pair" && report.state === "succeeded") {
            rtt = Math.round((report.currentRoundTripTime ?? 0) * 1000);
          }
        });
        if (w > 0 && h > 0) setRes(`${w}×${h}${fps ? ` @ ${Math.round(fps)}fps` : ""}`);
        if (rtt > 0 || kbps > 0) {
          setStats(`${rtt ? `${rtt}ms RTT` : ""}${rtt && kbps ? " · " : ""}${kbps ? `${kbps} kbps` : ""}`);
        }
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [activeCam, cams]);

  useEffect(() => {
    const t = getTransport();
    let alive = true;

    const send = (e: ShowEventInput) =>
      t.publish({ ...e, id: newEventId(), ts: Date.now() } as ShowEvent);

    const ensurePc = (camId: string): CamPeer => {
      const existing = peersRef.current.get(camId);
      if (existing && !["closed", "failed"].includes(existing.pc.connectionState)) {
        if (arenaRef.current && !arenaRef.current.contains(existing.video)) {
          arenaRef.current.appendChild(existing.video);
        }
        return existing;
      }

      if (existing) {
        existing.pc.close();
        existing.video.remove();
      }

      const pc = new RTCPeerConnection(RTC_CFG);
      const video = document.createElement("video");
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      video.style.cssText =
        "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:none;background:#000;";
      if (arenaRef.current) arenaRef.current.appendChild(video);

      const peer: CamPeer = {
        pc,
        video,
        pendingCandidates: [],
        answeredOffer: null,
      };

      pc.ontrack = (e) => {
        try {
          (e.receiver as RTCRtpReceiver & { playoutDelayHint?: number }).playoutDelayHint = 0;
        } catch {}
        video.srcObject = e.streams[0] || new MediaStream([e.track]);
        void video.play().catch(() => {});
        if (alive) dispatch({ type: "cam-status", camId, live: true });
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          send({
            type: "cam-ice",
            from: "stage",
            camId,
            candidate: e.candidate.toJSON(),
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (alive) {
          const s = pc.connectionState;
          if (s === "connected") {
            dispatch({ type: "cam-status", camId, live: true });
          } else if (["disconnected", "failed", "closed"].includes(s)) {
            dispatch({ type: "cam-status", camId, live: false });
          }
        }
      };

      peersRef.current.set(camId, peer);
      return peer;
    };

    const unsub = t.subscribe(async (ev) => {
      switch (ev.type) {
        case "cam-hello": {
          dispatch({ type: "cam-hello", camId: ev.camId });
          ensurePc(ev.camId);
          send({ type: "cam-request" });
          break;
        }
        case "cam-bye": {
          const peer = peersRef.current.get(ev.camId);
          peer?.pc.close();
          peer?.video.remove();
          peersRef.current.delete(ev.camId);
          dispatch({ type: "cam-bye", camId: ev.camId });
          break;
        }
        case "cam-offer": {
          const peer = ensurePc(ev.camId);
          const pc = peer.pc;
          const offerStr = JSON.stringify(ev.sdp);
          if (peer.answeredOffer === offerStr && pc.signalingState === "stable") return;

          try {
            if (pc.signalingState !== "stable") {
              /* reset peer if in wrong state */
              const freshPeer = ensurePc(ev.camId);
              await freshPeer.pc.setRemoteDescription(new RTCSessionDescription(ev.sdp));
              while (freshPeer.pendingCandidates.length > 0) {
                const c = freshPeer.pendingCandidates.shift();
                if (c) await freshPeer.pc.addIceCandidate(new RTCIceCandidate(c));
              }
              const ans = await freshPeer.pc.createAnswer();
              await freshPeer.pc.setLocalDescription(ans);
              freshPeer.answeredOffer = offerStr;
              send({ type: "cam-answer", camId: ev.camId, sdp: ans });
              return;
            }

            await pc.setRemoteDescription(new RTCSessionDescription(ev.sdp));
            while (peer.pendingCandidates.length > 0) {
              const c = peer.pendingCandidates.shift();
              if (c) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(c));
                } catch (e) {
                  console.warn("addIceCandidate stage error:", e);
                }
              }
            }
            const ans = await pc.createAnswer();
            await pc.setLocalDescription(ans);
            peer.answeredOffer = offerStr;
            send({ type: "cam-answer", camId: ev.camId, sdp: ans });
          } catch (err) {
            console.error("CameraWindow offer processing error:", err);
          }
          break;
        }
        case "cam-ice": {
          if (ev.from === "phone") {
            const peer = peersRef.current.get(ev.camId);
            if (peer) {
              if (peer.pc.remoteDescription && peer.pc.remoteDescription.type) {
                try {
                  await peer.pc.addIceCandidate(new RTCIceCandidate(ev.candidate));
                } catch (e) {
                  console.warn("addIceCandidate stage error:", e);
                }
              } else {
                peer.pendingCandidates.push(ev.candidate);
              }
            }
          }
          break;
        }
      }
    });

    /* poll phones to announce presence */
    send({ type: "cam-request" });
    const hb = setInterval(() => send({ type: "cam-request" }), 4000);

    return () => {
      alive = false;
      clearInterval(hb);
      unsub();
      peersRef.current.forEach((p) => {
        p.pc.close();
        p.video.remove();
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
      if (on && arenaRef.current && !arenaRef.current.contains(p.video)) {
        arenaRef.current.appendChild(p.video);
      }
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
