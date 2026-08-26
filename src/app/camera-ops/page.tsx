"use client";

/* /camera-ops — the dedicated CAMERA OPERATOR console.
   A focused control surface for whoever runs the multi-camera broadcast:
   - live roster of every phone that has joined (CAM 1, CAM 2, …)
   - one-tap CUT to put a camera on the stage screen
   - stage display on/off (cameraOn) + layout (PIP / FULLSCREEN / HIDDEN)
   - live link + TURN diagnostics so a cross-network relay problem is
     visible from the operator's seat instead of a black stage screen

   The actual video renders on /stage (CameraWindow); this page drives it. */

import { useEffect } from "react";
import { useShow } from "@/store/show";
import { getTransport } from "@/realtime/transport";
import { iceServers } from "@/realtime/rtc";

const btn =
  "border-2 px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors";

export default function CameraOpsPage() {
  const init = useShow((s) => s.init);
  const dispatch = useShow((s) => s.dispatch);
  const cameraOn = useShow((s) => s.cameraOn);
  const camLayout = useShow((s) => s.camLayout ?? "pip");
  const activeCam = useShow((s) => s.activeCam);
  const cams = useShow((s) => s.cams);
  const transportKind = useShow((s) => s.transportKind);

  useEffect(() => {
    init();
  }, [init]);

  /* whether a TURN relay is actually configured, or we're on the unreliabile
     public OpenRelay fallback — the whole reason cross-network can break */
  const relayMode = (() => {
    const urls = process.env.NEXT_PUBLIC_TURN_URLS;
    if (urls && urls.trim().split(",").filter(Boolean).length > 0) return "own";
    return "openrelay";
  })();

  const linkTxt =
    transportKind === "server" ? "SERVER LINK" : "LOCAL TABS LINK";

  const cut = (id: string) => {
    /* putting a cam on air implies the broadcast system is on */
    dispatch({ type: "toggle", key: "cameraOn", on: true });
    dispatch({ type: "cam-active", camId: id });
  };

  const setLayout = (mode: "pip" | "fullscreen" | "hidden") => {
    dispatch({ type: "cam-layout", mode });
    if (mode !== "hidden") dispatch({ type: "toggle", key: "cameraOn", on: true });
  };

  const camIds = Object.keys(cams);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-5 bg-court px-5 py-6 text-ice">
      <header className="flex items-end justify-between border-b-2 border-ice/10 pb-3">
        <div>
          <div className="font-body text-[11px] font-bold tracking-[0.4em] text-mag">
            CAMERA OPERATOR
          </div>
          <h1 className="mt-1 font-display text-5xl uppercase leading-[0.9]">
            Broadcast <span className="text-volt">control</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] font-bold tracking-wider">
          <span
            className={`border px-2 py-0.5 ${
              transportKind === "server"
                ? "border-volt text-volt"
                : "border-ice/30 text-ice/50"
            }`}
          >
            {linkTxt}
          </span>
          <span
            className={`border px-2 py-0.5 ${
              relayMode === "own" ? "border-volt text-volt" : "border-[#ffd23f] text-[#ffd23f]"
            }`}
            title={
              relayMode === "own"
                ? "TURN relay configured — cross-network media relays through your coturn."
                : "Using the public OpenRelay test relay — unreliable across different networks. Set NEXT_PUBLIC_TURN_* env vars."
            }
          >
            {relayMode === "own" ? "TURN: OWN" : "TURN: FALLBACK"}
          </span>
        </div>
      </header>

      {/* on-air / layout strip */}
      <section className="grid gap-3 sm:grid-cols-2">
        <div className="border-2 border-ice/15 bg-panel/50 p-4">
          <div className="font-mono text-[10px] font-bold tracking-[0.3em] text-ice/40">
            STAGE DISPLAY
          </div>
          <button
            onClick={() => dispatch({ type: "toggle", key: "cameraOn", on: !cameraOn })}
            className={`mt-2 w-full border-2 py-3 font-display text-2xl uppercase transition-colors ${
              cameraOn
                ? "border-volt bg-volt text-court"
                : "border-ice/20 text-ice/60 hover:border-ice/40 hover:text-ice"
            }`}
          >
            {cameraOn ? "ON AIR" : "STAGE CAM OFF"}
          </button>
        </div>

        <div className="border-2 border-ice/15 bg-panel/50 p-4">
          <div className="font-mono text-[10px] font-bold tracking-[0.3em] text-ice/40">
            STAGE LAYOUT
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(["pip", "fullscreen", "hidden"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setLayout(m)}
                className={`${btn} py-3 text-center ${
                  camLayout === m && (cameraOn || m === "hidden")
                    ? "border-mag bg-mag/20 text-ice"
                    : "border-ice/15 text-ice/60 hover:border-white/30"
                }`}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>
          <p className="mt-2 font-mono text-[10px] text-ice/40">
            {camLayout === "hidden"
              ? "Tucked off-screen. CUT a camera to bring it back."
              : camLayout === "fullscreen"
              ? "Full-frame on the stage screen."
              : "Corner slide-up overlay."}
          </p>
        </div>
      </section>

      {/* live camera roster */}
      <section className="border-2 border-ice/15 bg-panel/50 p-4">
        <div className="font-mono text-[10px] font-bold tracking-[0.3em] text-ice/40">
          LIVE CAMERAS
        </div>

        {camIds.length === 0 && (
          <div className="mt-3 border border-dashed border-ice/20 p-6 text-center">
            <div className="font-display text-2xl uppercase text-ice/50">
              No phones on the feed
            </div>
            <p className="mt-2 font-body text-[13px] text-ice/50">
              Someone opens <span className="font-mono text-volt">/camera</span> on a phone and taps
              START BROADCAST. Phones can join from any network — but if they&apos;re not on the
              stage&apos;s network, the media needs a working TURN relay.
            </p>
          </div>
        )}

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(cams).map(([id, cam]) => {
            const isActive = activeCam === id;
            return (
              <div
                key={id}
                className={`flex flex-col gap-3 border-2 p-3 transition-colors ${
                  isActive ? "border-volt bg-volt/10" : "border-ice/10"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      cam.live ? "animate-pulse bg-volt" : "bg-ice/30"
                    }`}
                  />
                  <span className="flex-1 font-display text-3xl uppercase">{cam.name}</span>
                  <span
                    className={`font-mono text-[10px] font-bold tracking-[0.2em] ${
                      cam.live ? "text-volt" : "text-ice/50"
                    }`}
                  >
                    {cam.live ? "STREAMING" : "CONNECTING"}
                  </span>
                </div>

                <button
                  onClick={() => (isActive ? dispatch({ type: "cam-active", camId: null }) : cut(id))}
                  className={`${btn} py-2 ${
                    isActive
                      ? "border-volt bg-volt text-court"
                      : "border-ice/30 text-ice hover:border-volt hover:text-volt"
                  }`}
                >
                  {isActive ? "ON AIR · CUT OFF" : "CUT TO STAGE"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* cross-network note */}
      <footer className="border-t-2 border-ice/10 pt-3 font-mono text-[10px] leading-relaxed text-ice/40">
        {relayMode === "own"
          ? "TURN relay configured — cameras can reach the stage from different networks."
          : "No NEXT_PUBLIC_TURN_URLS set — falling back to the public OpenRelay relay. That is rehearsal-grade only, unreliable across different networks. Deploy your own coturn and set NEXT_PUBLIC_TURN_URLS/USERNAME/CREDENTIAL before show day."}
      </footer>
    </main>
  );
}
