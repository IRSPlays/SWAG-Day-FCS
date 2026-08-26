"use client";

/* useCamViewer — one side of the multi-viewer camera broadcast.

   The PHONE offers; a VIEWER (the /stage CameraWindow or the /camera-ops
   multiview) answers. Every viewer owns a stable viewerId ("stage" for the
   stage window, "ops-…" for the ops console) and tags every signaling
   message with it, so each viewer gets its own WebRTC peer connection to
   every phone without crosstalk — that is what makes a live multiview
   possible while the stage still cuts between cameras.

   Handles: heartbeat requests, per-camera RTCPeerConnections, queued ICE,
   duplicate-offer suppression, dead-peer cleanup, and imperative <video>
   elements that can be moved between DOM hosts (tiles / fullscreen arena)
   without interrupting playback. */

import { useEffect, useRef } from "react";
import { getTransport } from "@/realtime/transport";
import { newEventId, type ShowEvent, type ShowEventInput } from "@/realtime/types";
import { iceServers } from "@/realtime/rtc";
import { useShow } from "@/store/show";

export interface CamPeerState {
  pc: RTCPeerConnection;
  video: HTMLVideoElement;
  pendingCandidates: RTCIceCandidateInit[];
  answeredOffer: string | null;
}

interface UseCamViewerOpts {
  /** stable identity on the bus; "stage" behaves exactly like the legacy world */
  viewerId: string;
  /** report cam-status live flags into the store (only the stage should) */
  reportStatus?: boolean;
  /** heartbeat cadence asking phones to (re-)offer */
  heartbeatMs?: number;
}

export function useCamViewer({ viewerId, reportStatus = false, heartbeatMs = 4000 }: UseCamViewerOpts) {
  const peersRef = useRef<Map<string, CamPeerState>>(new Map());
  /* host registry: camId -> current DOM parent for that camera's video */
  const hostsRef = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    const t = getTransport();
    let alive = true;

    const send = (e: ShowEventInput) =>
      t.publish({ ...e, id: newEventId(), ts: Date.now() } as ShowEvent);

    const attachVideo = (camId: string, video: HTMLVideoElement) => {
      const host = hostsRef.current.get(camId);
      if (host && video.parentElement !== host) {
        host.appendChild(video);
        video.style.display = "block";
      }
    };

    const ensurePc = (camId: string): CamPeerState => {
      const existing = peersRef.current.get(camId);
      if (existing && !["closed", "failed"].includes(existing.pc.connectionState)) {
        attachVideo(camId, existing.video);
        return existing;
      }
      if (existing) {
        existing.pc.close();
        existing.video.remove();
      }

      const pc = new RTCPeerConnection({ iceServers: iceServers(), iceCandidatePoolSize: 10 });
      const video = document.createElement("video");
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      video.style.cssText =
        "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:none;background:#000;";
      attachVideo(camId, video);

      const peer: CamPeerState = { pc, video, pendingCandidates: [], answeredOffer: null };

      pc.ontrack = (e) => {
        try {
          (e.receiver as RTCRtpReceiver & { playoutDelayHint?: number }).playoutDelayHint = 0;
        } catch {}
        video.srcObject = e.streams[0] || new MediaStream([e.track]);
        void video.play().catch(() => {});
        if (alive && reportStatus) useShow.getState().dispatch({ type: "cam-status", camId, live: true });
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          send({
            type: "cam-ice",
            from: viewerId,
            camId,
            candidate: e.candidate.toJSON(),
            to: camId,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (!alive) return;
        const s = pc.connectionState;
        const status = (live: boolean) =>
          reportStatus && useShow.getState().dispatch({ type: "cam-status", camId, live });
        if (s === "connected") {
          status(true);
        } else if (s === "failed") {
          status(false);
          pc.close();
          video.remove();
          peersRef.current.delete(camId);
        } else if (s === "disconnected" || s === "closed") {
          status(false);
        }
      };

      peersRef.current.set(camId, peer);
      return peer;
    };

    const answerOffer = async (
      camId: string,
      sdp: RTCSessionDescriptionInit,
      offerStr: string
    ) => {
      const peer = peersRef.current.get(camId);
      if (!peer) return;
      const pc = peer.pc;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const p = peersRef.current.get(camId)!;
        const queued = p.pendingCandidates;
        p.pendingCandidates = [];
        for (const c of queued) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          } catch (e) {
            console.warn("queued addIceCandidate:", e);
          }
        }
        const ans = await pc.createAnswer();
        await pc.setLocalDescription(ans);
        p.answeredOffer = offerStr;
        send({ type: "cam-answer", camId, sdp: ans, to: camId, from: viewerId });
      } catch (err) {
        console.error(`[${viewerId}] answering offer failed`, err);
      }
    };

    const unsub = t.subscribe(async (ev) => {
      switch (ev.type) {
        case "cam-hello": {
          ensurePc(ev.camId);
          break;
        }
        case "cam-bye": {
          /* NO re-publish: the phone's original cam-bye already reaches every
             store via transport fan-out (re-publishing reflects forever). */
          const peer = peersRef.current.get(ev.camId);
          peer?.pc.close();
          peer?.video.remove();
          peersRef.current.delete(ev.camId);
          break;
        }
        case "cam-offer": {
          /* only handle offers addressed to THIS viewer (no tag = legacy stage) */
          if ((ev.to ?? "stage") !== viewerId) return;
          const offerStr = JSON.stringify(ev.sdp);
          let peer = peersRef.current.get(ev.camId);
          if (peer?.answeredOffer === offerStr) return; /* exact duplicate */

          if (peer && peer.pc.signalingState !== "stable") {
            /* genuinely NEW offer mid-negotiation: roll a fresh peer */
            peer.pc.close();
            peer.video.remove();
            peersRef.current.delete(ev.camId);
            peer = undefined;
          }
          peer = peer ?? ensurePc(ev.camId);
          await answerOffer(ev.camId, ev.sdp, offerStr);
          break;
        }
        case "cam-ice": {
          if ((ev.to ?? viewerId) !== viewerId) return;
          const peer = peersRef.current.get(ev.camId) ?? ensurePc(ev.camId);
          if (peer.pc.remoteDescription && peer.pc.remoteDescription.type) {
            try {
              await peer.pc.addIceCandidate(new RTCIceCandidate(ev.candidate));
            } catch (e) {
              console.warn("addIceCandidate:", e);
            }
          } else {
            peer.pendingCandidates.push(ev.candidate);
          }
          break;
        }
      }
    });

    /* heartbeat: phones re-offer to THIS viewer when their attempt goes stale */
    send({ type: "cam-request", from: viewerId });
    const hb = setInterval(() => send({ type: "cam-request", from: viewerId }), heartbeatMs);

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
    // viewerId is a mount-stable identity; recreating every render would tear down calls
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerId, reportStatus, heartbeatMs]);

  /** move (or detach) a camera's persistent <video> into a host element */
  const mountVideo = (camId: string, host: HTMLElement | null) => {
    if (host) hostsRef.current.set(camId, host);
    else hostsRef.current.delete(camId);
    const peer = peersRef.current.get(camId);
    if (!peer) return;
    if (host) {
      if (peer.video.parentElement !== host) host.appendChild(peer.video);
      peer.video.style.display = "block";
    }
  };

  const getPeer = (camId: string) => peersRef.current.get(camId);

  return { mountVideo, getPeer, peersRef };
}
