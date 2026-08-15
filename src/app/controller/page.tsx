"use client";

/* /controller — the Tech Lead / MC console.
   Left: deck pilot (live preview, GO buttons, deck strip, timers, toggles).
   Right: audio mixer (faders, beds, crossfade, SFX pads) + audience QR.
   Audio EXECUTES on the stage machine; this console only sends commands. */

import { useEffect, useState } from "react";
import Link from "next/link";
import DeckPlayer from "@/engine/DeckPlayer";
import { QRCodeSVG } from "qrcode.react";
import { useShow } from "@/store/show";
import { useEffectiveDeck, useDeckIds } from "@/store/deckSelect";
import { deck } from "@/slides/deck";
import { PADS } from "@/audio/soundboard";

const btn =
  "border-2 px-3 py-2 font-body text-[13px] font-bold tracking-[0.18em] transition-colors";

function Fader({
  label,
  value,
  accent,
  onChange,
}: {
  label: string;
  value: number;
  accent: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="flex justify-between font-body text-[12px] font-bold tracking-[0.25em] text-ice/60">
        <span>{label}</span>
        <span className="tabular-nums">{Math.round(value * 100)}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className={`w-full accent-current ${accent}`}
      />
    </label>
  );
}

function TimerChip({ endsAt }: { endsAt: number }) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((x) => x + 1), 250);
    return () => clearInterval(id);
  }, []);
  const left = Math.max(0, endsAt - Date.now());
  const s = Math.ceil(left / 1000);
  return (
    <span className="border-2 border-volt px-3 py-1 font-display text-xl text-volt tabular-nums">
      {String(Math.floor(s / 60)).padStart(2, "0")}:{String(s % 60).padStart(2, "0")}
    </span>
  );
}

export default function ControllerPage() {
  const init = useShow((s) => s.init);
  const dispatch = useShow((s) => s.dispatch);
  const index = useShow((s) => s.index);
  const dir = useShow((s) => s.dir);
  const blackout = useShow((s) => s.blackout);
  const qrOn = useShow((s) => s.qrOn);
  const cameraOn = useShow((s) => s.cameraOn);
  const activeCam = useShow((s) => s.activeCam);
  const cams = useShow((s) => s.cams);
  const pollOpen = useShow((s) => s.pollOpen);
  const surveyOpen = useShow((s) => s.surveyOpen);
  const timerEndsAt = useShow((s) => s.timerEndsAt);
  const audio = useShow((s) => s.audio);
  const hidden = useShow((s) => s.hidden);
  const transportKind = useShow((s) => s.transportKind);
  const ids = useDeckIds();
  const deckList = useEffectiveDeck();

  useEffect(() => {
    init();
  }, [init]);

  const current = deckList[Math.max(0, Math.min(index, deckList.length - 1))];

  const go = (i: number) => dispatch({ type: "cue", index: i, dir: i >= index ? 1 : -1 });

  const move = (id: string, delta: number) => {
    const next = [...ids];
    const from = next.indexOf(id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= next.length) return;
    [next[from], next[to]] = [next[to], next[from]];
    dispatch({ type: "deck", order: next });
  };

  const toggleHidden = (id: string) =>
    dispatch({
      type: "deck",
      hidden: hidden.includes(id) ? hidden.filter((h) => h !== id) : [...hidden, id],
    });

  /* hotkeys */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const pad = PADS.find((p) => `Digit${p.key}` === e.code);
      if (pad) dispatch({ type: "audio", cmd: { kind: "sfx", id: pad.id } });
      else if (e.code === "ArrowRight")
        dispatch({ type: "cue", index: Math.min(deckList.length - 1, index + 1), dir: 1 });
      else if (e.code === "ArrowLeft")
        dispatch({ type: "cue", index: Math.max(0, index - 1), dir: -1 });
      else if (e.code === "KeyB")
        dispatch({ type: "toggle", key: "blackout", on: !useShow.getState().blackout });
      else if (e.code === "KeyV") {
        /* cycle the broadcast camera */
        const camIds = Object.keys(useShow.getState().cams);
        if (camIds.length) {
          const cur = useShow.getState().activeCam;
          const idx = camIds.indexOf(cur ?? "");
          dispatch({ type: "cam-active", camId: camIds[(idx + 1) % camIds.length] });
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, deckList.length, dispatch]);

  const audienceUrl =
    typeof window !== "undefined" ? `${window.location.origin}/audience` : "/audience";

  return (
    <div className="flex min-h-screen flex-col bg-court text-ice">
      {/* header */}
      <header className="flex items-center justify-between border-b-2 border-ice/10 px-5 py-3">
        <div className="flex items-baseline gap-4">
          <span className="font-display text-2xl uppercase">Controller</span>
          <span className="font-serifit italic text-ice/50">tech lead console</span>
        </div>
        <div className="flex items-center gap-4">
          <span
            className={`border-2 px-3 py-1 font-body text-[12px] font-bold tracking-[0.25em] ${
              transportKind === "server" ? "border-volt text-volt" : "border-ice/30 text-ice/50"
            }`}
          >
            {transportKind === "server" ? "● SERVER LINK" : "● LOCAL TABS LINK"}
          </span>
          <Link href="/preview" className={`${btn} border-ice/25 text-ice/70 hover:border-volt hover:text-volt`}>
            PREVIEW
          </Link>
          <Link href="/editor" className={`${btn} border-ice/25 text-ice/70 hover:border-volt hover:text-volt`}>
            EDITOR
          </Link>
          <Link href="/report" className={`${btn} border-ice/25 text-ice/70 hover:border-volt hover:text-volt`}>
            REPORT
          </Link>
        </div>
      </header>

      <main className="grid flex-1 gap-4 p-4 lg:grid-cols-[1.25fr_1fr]">
        {/* ---------------- deck pilot ---------------- */}
        <section className="flex flex-col gap-4">
          {/* live preview */}
          <div className="h-[300px] overflow-hidden border-2 border-ice/15 bg-black">
            {current && <DeckPlayer slide={current} dir={dir} />}
          </div>

          {/* transport */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => go(Math.max(0, index - 1))}
              className={`${btn} border-ice/25 text-ice/80 hover:border-volt hover:text-volt`}
            >
              ← BACK
            </button>
            <button
              onClick={() => go(Math.min(deckList.length - 1, index + 1))}
              className={`${btn} border-volt bg-volt text-court hover:border-ice hover:bg-ice`}
            >
              GO NEXT →
            </button>
            <button
              onClick={() => dispatch({ type: "toggle", key: "blackout", on: !blackout })}
              className={`${btn} ${
                blackout ? "border-mag bg-mag text-ice" : "border-mag text-mag hover:bg-mag hover:text-ice"
              }`}
            >
              {blackout ? "■ BLACKOUT ON" : "BLACKOUT"}
            </button>
            <span className="ml-auto font-display text-3xl text-volt tabular-nums">
              {String(index + 1).padStart(2, "0")}/{String(deckList.length).padStart(2, "0")}
            </span>
          </div>

          {/* toggles + timer */}
          <div className="flex flex-wrap items-center gap-3">
            {(
              [
                ["qrOn", qrOn, "QR BADGE"],
                ["cameraOn", cameraOn, "STAGE CAM"],
                ["pollOpen", pollOpen, "OPEN VOTING"],
                ["surveyOpen", surveyOpen, "SURVEY"],
              ] as const
            ).map(([key, on, label]) => (
              <button
                key={key}
                onClick={() => dispatch({ type: "toggle", key, on: !on })}
                className={`${btn} ${
                  on ? "border-vio bg-vio text-court" : "border-ice/25 text-ice/70 hover:border-vio hover:text-vio"
                }`}
              >
                {label}
              </button>
            ))}
            <span className="mx-2 h-6 w-0.5 bg-ice/15" />
            {[30, 60, 300].map((sec) => (
              <button
                key={sec}
                onClick={() => dispatch({ type: "timer", endsAt: Date.now() + sec * 1000 })}
                className={`${btn} border-ice/25 text-ice/70 hover:border-volt hover:text-volt`}
              >
                {sec < 60 ? `0:${String(sec).padStart(2, "0")}` : `${sec / 60}:00`}
              </button>
            ))}
            <button
              onClick={() => dispatch({ type: "timer", endsAt: null })}
              className={`${btn} border-ice/25 text-ice/70 hover:border-mag hover:text-mag`}
            >
              STOP
            </button>
            {timerEndsAt && <TimerChip endsAt={timerEndsAt} />}
          </div>

          {/* deck strip */}
          <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto border-2 border-ice/10 p-2">
            {ids.map((id, i) => {
              const mod = deck.find((m) => m.meta.id === id);
              if (!mod) return null;
              const isHidden = hidden.includes(id);
              const effIndex = deckList.findIndex((m) => m.meta.id === id);
              return (
                <div
                  key={id}
                  className={`flex items-center gap-2 border-2 px-3 py-2 ${
                    effIndex === index ? "border-volt bg-volt/10" : "border-ice/10 bg-panel/60"
                  } ${isHidden ? "opacity-40" : ""}`}
                >
                  <button
                    onClick={() => !isHidden && effIndex >= 0 && go(effIndex)}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    <span className="font-display text-xl text-volt">{String(i + 1).padStart(2, "0")}</span>
                    <span className="font-body text-[14px] font-bold tracking-[0.14em]">
                      {mod.meta.title.toUpperCase()}
                    </span>
                  </button>
                  <button onClick={() => move(id, -1)} className="px-1 text-ice/50 hover:text-volt">▲</button>
                  <button onClick={() => move(id, 1)} className="px-1 text-ice/50 hover:text-volt">▼</button>
                  <button
                    onClick={() => toggleHidden(id)}
                    className={`px-1 font-body text-[11px] font-bold tracking-[0.15em] ${
                      isHidden ? "text-mag" : "text-ice/50 hover:text-ice"
                    }`}
                  >
                    {isHidden ? "HIDDEN" : "SHOWN"}
                  </button>
                </div>
              );
            })}
          </div>

          {/* notes */}
          <div className="border-2 border-ice/10 bg-panel/60 p-3">
            <div className="font-body text-[11px] font-bold tracking-[0.3em] text-volt">
              SPEAKER NOTES
            </div>
            <p className="mt-1 font-body text-[14px] text-ice/75">{current?.meta.notes ?? "—"}</p>
          </div>
        </section>

        {/* ---------------- audio mixer ---------------- */}
        <section className="flex flex-col gap-4">
          <div className="border-2 border-ice/10 bg-panel/60 p-4">
            <div className="flex items-center justify-between">
              <span className="font-display text-2xl uppercase">Audio Mixer</span>
              <span className="font-body text-[11px] font-bold tracking-[0.2em] text-ice/40">
                PLAYS ON THE STAGE MACHINE
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-5">
              <Fader
                label="MASTER"
                value={audio.master}
                accent="text-volt"
                onChange={(v) => dispatch({ type: "audio", cmd: { kind: "gain", bus: "master", value: v } })}
              />
              <Fader
                label="MUSIC"
                value={audio.music}
                accent="text-vio"
                onChange={(v) => dispatch({ type: "audio", cmd: { kind: "gain", bus: "music", value: v } })}
              />
              <Fader
                label="SFX"
                value={audio.sfx}
                accent="text-mag"
                onChange={(v) => dispatch({ type: "audio", cmd: { kind: "gain", bus: "sfx", value: v } })}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={() => dispatch({ type: "audio", cmd: { kind: "bed-start", bed: "A" } })}
                className={`${btn} ${audio.bed === "A" ? "border-volt bg-volt text-court" : "border-ice/25 text-ice/70 hover:border-volt hover:text-volt"}`}
              >
                ▶ BED A · HYPE 126
              </button>
              <button
                onClick={() =>
                  dispatch({ type: "audio", cmd: { kind: "crossfade", to: "B", seconds: audio.fadeSeconds } })
                }
                className={`${btn} ${audio.bed === "B" ? "border-vio bg-vio text-court" : "border-ice/25 text-ice/70 hover:border-vio hover:text-vio"}`}
              >
                ⇄ BED B · CHILL 92
              </button>
              <button
                onClick={() => dispatch({ type: "audio", cmd: { kind: "bed-stop" } })}
                className={`${btn} border-mag text-mag hover:bg-mag hover:text-ice`}
              >
                ■ STOP
              </button>
              <span className="font-body text-[11px] font-bold tracking-[0.2em] text-ice/40">FADE</span>
              {[1, 2, 4, 8].map((f) => (
                <button
                  key={f}
                  onClick={() => dispatch({ type: "audio", cmd: { kind: "fade-seconds", seconds: f } })}
                  className={`${btn} ${audio.fadeSeconds === f ? "border-volt text-volt" : "border-ice/20 text-ice/50"}`}
                >
                  {f}s
                </button>
              ))}
              <button
                onClick={() => dispatch({ type: "audio", cmd: { kind: "duck", on: !audio.duck } })}
                className={`${btn} ${audio.duck ? "border-vio bg-vio text-court" : "border-ice/20 text-ice/50"}`}
              >
                DUCK {audio.duck ? "ON" : "OFF"}
              </button>
            </div>
          </div>

          {/* SFX pads */}
          <div className="grid grid-cols-3 gap-3">
            {PADS.map((p) => (
              <button
                key={p.id}
                onClick={() => dispatch({ type: "audio", cmd: { kind: "sfx", id: p.id } })}
                className={`border-2 bg-panel/60 px-4 py-5 text-left transition-transform active:scale-95 ${p.skin}`}
              >
                <div className="font-display text-[26px] uppercase leading-none">{p.label}</div>
                <div className="mt-2 font-body text-[11px] font-bold tracking-[0.3em] opacity-70">
                  KEY {p.key}
                </div>
              </button>
            ))}
          </div>

          {/* cameras — multi-cam: every connected phone, pick the broadcast source */}
          <div className="border-2 border-ice/10 bg-panel/60 p-4">
            <div className="flex items-center justify-between">
              <span className="font-display text-2xl uppercase">Cameras</span>
              <span className="font-body text-[11px] font-bold tracking-[0.2em] text-ice/40">
                PHONE → STAGE · KEY V CYCLES
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {Object.keys(cams).length === 0 && (
                <p className="font-body text-[13px] text-ice/50">
                  No phones live yet — a phone joins at /camera and becomes CAM 1.
                </p>
              )}
              {Object.entries(cams).map(([id, cam]) => (
                <div
                  key={id}
                  className={`flex items-center gap-3 border-2 px-3 py-2 transition-colors ${
                    activeCam === id ? "border-mag bg-mag/10" : "border-ice/10"
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      cam.live ? "animate-pulse bg-volt" : "bg-ice/30"
                    }`}
                  />
                  <span className="flex-1 font-body text-[14px] font-bold tracking-[0.18em]">
                    {cam.name}
                  </span>
                  <span className="font-body text-[10px] font-bold tracking-[0.2em] text-ice/50">
                    {cam.live ? "STREAMING" : "CONNECTING"}
                  </span>
                  <button
                    onClick={() =>
                      dispatch({ type: "cam-active", camId: activeCam === id ? null : id })
                    }
                    className={`${btn} ${
                      activeCam === id
                        ? "border-mag bg-mag text-ice"
                        : "border-volt text-volt hover:bg-volt hover:text-court"
                    }`}
                  >
                    {activeCam === id ? "OFF AIR" : "ON STAGE"}
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => dispatch({ type: "toggle", key: "cameraOn", on: !cameraOn })}
                className={`${btn} flex-1 ${
                  cameraOn
                    ? "border-mag bg-mag text-ice"
                    : "border-ice/25 text-ice/60 hover:border-mag hover:text-mag"
                }`}
              >
                STAGE CAM {cameraOn ? "ON" : "OFF"}
              </button>
              <button
                onClick={() => dispatch({ type: "toggle", key: "cameraOn", on: true })}
                className={`${btn} flex-1 ${
                  activeCam ? "border-volt bg-volt text-court" : "border-ice/25 text-ice/50"
                }`}
                disabled={!activeCam}
              >
                CUT TO {activeCam ? (cams[activeCam]?.name ?? "CAM") : "—"}
              </button>
            </div>
            <p className="mt-2 font-body text-[11px] text-ice/40">
              Every connected phone stays hot in the background — switching is instant, no
              re-warming.
            </p>
          </div>

          {/* audience QR */}
          <div className="flex items-center gap-5 border-2 border-ice/10 bg-panel/60 p-4">
            <div className="bg-ice p-2">
              <QRCodeSVG value={audienceUrl} size={130} bgColor="#f4f7ff" fgColor="#08060f" />
            </div>
            <div>
              <div className="font-body text-[13px] font-bold tracking-[0.3em] text-volt">
                AUDIENCE JOIN
              </div>
              <p className="mt-1 font-body text-[13px] text-ice/60">
                Phones scan → react, vote, survey. Zero login. Syncs across tabs locally; across
                devices once Supabase keys are set.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
