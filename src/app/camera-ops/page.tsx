"use client";

/* /camera-ops — the CAMERA OPERATOR console with a live MULTIVIEW.
   Runs a second independent viewer ("ops-…") beside the stage's "stage"
   viewer: every phone serves its stream to both simultaneously.
   Each tile = one phone's live feed + minimal debug (state · ice · kbps).

   This page does NOT report cam-status to the store (the stage owns that);
   it uses useCamViewer for peers and the show store for CUT / layout
   / on-air controls. */

import { useEffect, useRef, useState } from "react";
import { useShow } from "@/store/show";
import { useCamViewer } from "@/realtime/useCamViewer";

const btn =
  "border-2 px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors";

interface TileStats {
  state: string;
  ice: string;
  kbps: number;
}

export default function CameraOpsPage() {
  const init = useShow((s) => s.init);
  const dispatch = useShow((s) => s.dispatch);
  const cameraOn = useShow((s) => s.cameraOn);
  const camLayout = useShow((s) => s.camLayout ?? "pip");
  const activeCam = useShow((s) => s.activeCam);
  const cams = useShow((s) => s.cams);
  const transportKind = useShow((s) => s.transportKind);

  /* stable per-tab viewer identity so the phone routes answers back here */
  const opsIdRef = useRef<string>("");
  if (!opsIdRef.current && typeof window !== "undefined") {
    const key = "swag-day-cam-ops-viewer";
    let id = localStorage.getItem(key);
    if (!id) {
      id = `ops-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(key, id);
    }
    opsIdRef.current = id;
  }
  const viewerId = opsIdRef.current || "ops";

  const { mountVideo, peersRef } = useCamViewer({ viewerId });

  const [tiles, setTiles] = useState<Record<string, TileStats>>({});
  const prevBytesRef = useRef<Record<string, { bytes: number; ts: number; kbps?: number }>>({});

  useEffect(() => {
    init();
  }, [init]);

  /* per-tile debug: connection state, ICE state, measured bitrate */
  useEffect(() => {
    const iv = setInterval(() => {
      const snapshot: Record<string, TileStats> = {};
      peersRef.current.forEach((p, camId) => {
        snapshot[camId] = {
          state: p.pc.connectionState,
          ice: p.pc.iceConnectionState,
          kbps: prevBytesRef.current[camId]?.kbps ?? 0,
        };
      });
      setTiles(snapshot);

      peersRef.current.forEach(async (p, camId) => {
        if (p.pc.connectionState !== "connected") return;
        try {
          const s = await p.pc.getStats();
          let bytes = 0;
          let ts = 0;
          s.forEach((r) => {
            if (r.type === "inbound-rtp" && !r.isRemote) {
              bytes = r.bytesReceived ?? bytes;
              ts = r.timestamp ?? ts;
            }
          });
          let kbps = 0;
          const prev = prevBytesRef.current[camId];
          if (prev && prev.bytes > 0 && ts > prev.ts) {
            kbps = Math.round(((bytes - prev.bytes) * 8) / ((ts - prev.ts) / 1000) / 1000);
          }
          prevBytesRef.current[camId] = { bytes, ts, kbps };
        } catch {
          /* stats unavailable mid-teardown — ignore */
        }
      });
    }, 1000);
  }, [peersRef]);

  /* keep each camera's <video> mounted in its tile (runs after every render,
     so newly created tiles grab their video element immediately) */
  useEffect(() => {
    peersRef.current.forEach((_p, camId) => {
      mountVideo(camId, document.getElementById(`ops-tile-${camId}`));
    });
  });

  const relayMode = (() => {
    const urls = process.env.NEXT_PUBLIC_TURN_URLS;
    if (urls && urls.trim().split(",").filter(Boolean).length > 0) return "own";
    return "openrelay";
  })();

  const cut = (id: string) => {
    dispatch({ type: "toggle", key: "cameraOn", on: true });
    dispatch({ type: "cam-active", camId: id });
  };

  const setLayout = (mode: "pip" | "fullscreen" | "hidden") => {
    dispatch({ type: "cam-layout", mode });
    if (mode !== "hidden") dispatch({ type: "toggle", key: "cameraOn", on: true });
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 bg-court px-5 py-6 text-ice">
      <header className="flex items-end justify-between border-b-2 border-ice/10 pb-3">
        <div>
          <div className="font-body text-[11px] font-bold tracking-[0.4em] text-mag">
            CAMERA OPERATOR · MULTIVIEW
          </div>
          <h1 className="mt-1 font-display text-5xl uppercase leading-[0.9]">
            Broadcast <span className="text-volt">control</span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 font-mono text-[11px] font-bold tracking-wider">
          <span
            className={`border px-2 py-0.5 ${
              transportKind === "server" ? "border-volt text-volt" : "border-ice/30 text-ice/50"
            }`}
          >
            {transportKind === "server" ? "SERVER LINK" : "LOCAL TABS"}
          </span>
          <span
            className={`border px-2 py-0.5 ${
              relayMode === "own" ? "border-volt text-volt" : "border-[#ffd23f] text-[#ffd23f]"
            }`}
            title={
              relayMode === "own"
                ? "TURN relay configured."
                : "Public OpenRelay fallback — unreliable across different networks."
            }
          >
            {relayMode === "own" ? "TURN OK" : "TURN FALLBACK"}
          </span>
        </div>
      </header>

      {/* stage control strip */}
      <section className="grid gap-3 sm:grid-cols-2">
        <div className="border-2 border-ice/15 bg-panel/50 p-3">
          <div className="font-mono text-[10px] font-bold tracking-[0.3em] text-ice/40">
            STAGE DISPLAY
          </div>
          <button
            onClick={() => dispatch({ type: "toggle", key: "cameraOn", on: !cameraOn })}
            className={`mt-2 w-full border-2 py-2.5 font-display text-xl uppercase ${
              cameraOn ? "border-volt bg-volt text-court" : "border-ice/20 text-ice/60"
            }`}
          >
            {cameraOn ? "ON AIR" : "STAGE CAM OFF"}
          </button>
        </div>

        <div className="border-2 border-ice/15 bg-panel/50 p-3">
          <div className="font-mono text-[10px] font-bold tracking-[0.3em] text-ice/40">
            STAGE LAYOUT
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(["pip", "fullscreen", "hidden"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setLayout(m)}
                className={`${btn} py-2.5 text-center ${
                  camLayout === m && (cameraOn || m === "hidden")
                    ? "border-mag bg-mag/20 text-ice"
                    : "border-ice/15 text-ice/60"
                }`}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* live multiview grid */}
      <section className="border-2 border-ice/15 bg-panel/50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold tracking-[0.3em] text-ice/40">
            LIVE FEEDS ({Object.keys(cams).length})
          </span>
          <span className="font-mono text-[10px] text-ice/30">viewer: {viewerId}</span>
        </div>

        {Object.keys(cams).length === 0 && (
          <div className="border border-dashed border-ice/20 p-6 text-center">
            <div className="font-display text-2xl uppercase text-ice/50">No phones on the feed</div>
            <p className="mt-2 font-body text-[13px] text-ice/50">
              Open <span className="font-mono text-volt">/camera</span> on a phone and tap START
              BROADCAST. Feeds appear here automatically — each phone streams to this console AND
              the stage at once.
            </p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(cams).map(([id, cam]) => {
            const st = tiles[id];
            const isActive = activeCam === id;
            return (
              <div
                key={id}
                className={`flex flex-col overflow-hidden border-2 transition-colors ${
                  isActive ? "border-volt" : "border-ice/10"
                }`}
              >
                {/* video tile host — useCamViewer appends the persistent <video> here */}
                <div
                  id={`ops-tile-${id}`}
                  className={`relative aspect-video bg-black ${
                    isActive ? "ring-2 ring-inset ring-volt" : ""
                  }`}
                />

                {/* label + minimal debug */}
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      st?.state === "connected"
                        ? st.kbps > 0
                          ? "animate-pulse bg-volt"
                          : "bg-[#ffd23f]"
                        : "bg-mag"
                    }`}
                    title={
                      st?.state === "connected"
                        ? st.kbps > 0
                          ? "connected, media flowing"
                          : "peer connected but no media yet"
                        : `state: ${st?.state ?? "no peer"} · ice: ${st?.ice ?? "-"}`
                    }
                  />
                  <span className="flex-1 font-display text-lg uppercase leading-none">
                    {cam.name}
                    {!cam.live && (
                      <span className="ml-1 font-mono text-[9px] text-ice/40">connecting</span>
                    )}
                  </span>
                  <span className="font-mono text-[9px] tracking-wide text-ice/40">
                    {st ? `${st.state}·${st.ice}${st.kbps ? `·${st.kbps}k` : ""}` : "no peer"}
                  </span>
                </div>

                <button
                  onClick={() =>
                    isActive ? dispatch({ type: "cam-active", camId: null }) : cut(id)
                  }
                  className={`${btn} border-x-0 border-b-0 py-2 ${
                    isActive
                      ? "border-volt bg-volt text-court"
                      : "border-ice/10 text-ice hover:border-volt hover:text-volt"
                  }`}
                >
                  {isActive ? "ON AIR · CUT OFF" : "CUT TO STAGE"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="mt-auto border-t-2 border-ice/10 pt-2 font-mono text-[10px] leading-relaxed text-ice/40">
        Tile dot: mag = no peer · amber = peer up but no media · blinking volt = media flowing.
        Hover for detail.
        {relayMode === "own"
          ? ""
          : " TURN FALLBACK means cross-network media will NOT connect — deploy your own coturn."}
      </footer>
    </main>
  );
}
