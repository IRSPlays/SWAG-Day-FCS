"use client";

/* CameraWindow — the STAGE-side hub of the multi-camera broadcast.
   The phone is always the offerer; this side answers (viewerId "stage").
   Uses the shared useCamViewer hook so the /camera-ops console can run a
   second, independent multiview of the same phones without crosstalk. */

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useShow } from "@/store/show";
import { useCamViewer } from "@/realtime/useCamViewer";

export default function CameraWindow() {
  const cameraOn = useShow((s) => s.cameraOn);
  const camLayout = useShow((s) => s.camLayout ?? "pip");
  const activeCam = useShow((s) => s.activeCam);
  const cams = useShow((s) => s.cams);
  const arenaRef = useRef<HTMLDivElement>(null);
  const prevStatsRef = useRef<{ bytes: number; ts: number }>({ bytes: 0, ts: 0 });
  const [res, setRes] = useState("");
  const [stats, setStats] = useState("");
  const [linkDiag, setLinkDiag] = useState("");

  const { mountVideo, getPeer, peersRef } = useCamViewer({
    viewerId: "stage",
    reportStatus: true,
  });

  /* derived visibility */
  const on = cameraOn && !!activeCam && !!cams[activeCam] && camLayout !== "hidden";
  const waiting = on && !!activeCam && !cams[activeCam]?.live;
  const isFullscreen = on && camLayout === "fullscreen";

  /* stall diagnostics for the CONNECTING overlay */
  useEffect(() => {
    if (!on || !waiting) {
      setLinkDiag("");
      return;
    }
    const iv = setInterval(() => {
      const p = activeCam ? getPeer(activeCam) : undefined;
      if (!p) {
        setLinkDiag("NO PEER — waiting for phone offer on /camera");
        return;
      }
      const q = p.pendingCandidates.length;
      setLinkDiag(
        `peer: ${p.pc.connectionState} · ice: ${p.pc.iceConnectionState}${
          q ? ` · ${q} candidates queued` : ""
        }`
      );
    }, 700);
    return () => clearInterval(iv);
  }, [on, waiting, activeCam, getPeer]);

  /* live network stats for the connected active camera */
  useEffect(() => {
    if (!activeCam) {
      setStats("");
      return;
    }
    const iv = setInterval(() => {
      const p = getPeer(activeCam);
      if (!p || p.pc.connectionState !== "connected") {
        setStats("");
        return;
      }
      void p.pc.getStats().then((s) => {
        let fps = 0;
        let w = 0;
        let h = 0;
        let bytes = 0;
        let ts = 0;
        let rtt = 0;
        s.forEach((report) => {
          if (report.type === "inbound-rtp" && !report.isRemote) {
            fps = report.framesPerSecond ?? fps;
            w = report.frameWidth ?? w;
            h = report.frameHeight ?? h;
            bytes = report.bytesReceived ?? bytes;
            ts = report.timestamp ?? ts;
          } else if (
            report.type === "candidate-pair" &&
            report.state === "succeeded" &&
            report.nominated
          ) {
            rtt = Math.round((report.currentRoundTripTime ?? 0) * 1000);
          }
        });
        if (w > 0) setRes(`${w}×${h}${fps ? ` @ ${Math.round(fps)}fps` : ""}`);
        const prev = prevStatsRef.current;
        let kbps = 0;
        if (prev.bytes > 0 && ts > prev.ts) {
          kbps = Math.round(((bytes - prev.bytes) * 8) / ((ts - prev.ts) / 1000) / 1000);
        }
        prevStatsRef.current = { bytes, ts };
        if (rtt > 0 || kbps > 0) {
          setStats(
            `${rtt ? `${rtt}ms` : ""}${rtt && kbps ? " · " : ""}${kbps ? `${kbps} kbps` : ""}`
          );
        }
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [activeCam, getPeer]);

  /* mount each camera's persistent <video> into the arena while it is the cut */
  useEffect(() => {
    peersRef.current.forEach((_p, camId) => {
      const show = camId === activeCam && on && !!arenaRef.current;
      mountVideo(camId, show ? arenaRef.current : null);
      const peer = peersRef.current.get(camId);
      if (peer) {
        peer.video.style.display = show ? "block" : "none";
        if (show && peer.video.videoWidth > 0) {
          setRes(`${peer.video.videoWidth}×${peer.video.videoHeight}`);
        }
      }
    });
  }, [activeCam, on, cams, mountVideo, peersRef]);

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
          <span>{waiting ? "AWAITING STREAM" : res || "LIVE"}</span>
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
              Open /camera on a mobile device and tap START BROADCAST
            </div>
            {linkDiag && (
              <div className="mt-3 inline-block bg-black/80 px-3 py-1 font-mono text-[11px] text-[#e1811f]">
                {linkDiag}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
