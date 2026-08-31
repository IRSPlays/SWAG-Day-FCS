"use client";

/* Central show store. One source of truth; every view (stage, controller,
   audience, camera, report) reads it and dispatches events through it. */

import { useMemo } from "react";
import { create } from "zustand";
import { getTransport } from "@/realtime/transport";
import { fireSlideAction } from "@/engine/advance";
import { newEventId, type ShowEvent, type ShowEventInput, type SurveyRow } from "@/realtime/types";

export interface Reaction {
  id: string;
  emoji: string;
}

export interface AudioUI {
  master: number;
  music: number;
  sfx: number;
  duck: boolean;
  bed: "A" | "B" | null;
  fadeSeconds: number;
}

export interface CamInfo {
  name: string;
  live: boolean;
}

/** live snapshot of whichever lyric slide is on stage (driven by /lyrics) */
export interface LyricUI {
  slideId: string;
  song?: string;
  artist?: string;
  manual: boolean;
  playing: boolean;
  line: number;
  lines: string[];
  section?: string;
}

export interface TournamentScores {
  sec1: number;
  sec2: number;
  sec3: number;
  sec4: number;
}

export interface BgmState {
  playing: boolean;
  track: string;
  artist: string;
  volume: number;
}

interface ShowState {
  ready: boolean;
  transportKind: "local" | "server";
  index: number;
  dir: 1 | -1;
  blackout: boolean;
  cameraOn: boolean;
  camLayout: "pip" | "fullscreen" | "hidden";
  qrOn: boolean;
  pollOpen: boolean;
  surveyOpen: boolean;
  timerEndsAt: number | null;
  /* multi-camera roster + the controller's current broadcast pick */
  cams: Record<string, CamInfo>;
  activeCam: string | null;
  /* live lyric-slide snapshot for the /lyrics operator console */
  lyric: LyricUI | null;
  /* tournament live scoring */
  scores: TournamentScores;
  /* outro background music */
  bgm: BgmState;
  votes: Record<string, number>;
  reactionCounts: Record<string, number>;
  reactions: Reaction[];
  surveys: SurveyRow[];
  overrides: Record<string, Record<string, unknown>>;
  metaOv: Record<string, Record<string, unknown>>;
  order: string[];
  hidden: string[];
  audio: AudioUI;
  init: () => void;
  dispatch: (ev: ShowEventInput) => void;
}
const PERSIST_KEY = "swag-day-fs-v1";
const seen = new Set<string>();

function loadPersisted(): Partial<
  Pick<ShowState, "overrides" | "metaOv" | "order" | "hidden" | "votes" | "surveys" | "scores">
> {
  if (typeof localStorage === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(PERSIST_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export const useShow = create<ShowState>((set, get) => {
  const persisted = loadPersisted();

  const apply = (ev: ShowEvent) => {
    switch (ev.type) {
      case "cue":
        set({ index: ev.index, dir: ev.dir });
        break;
      case "advance":
        /* EVERY client mirrors slide-level interactions (award reveals,
           lyric word-steps, game reveals) by running the action against
           its own slide instance. The stage additionally handles the
           cue fallback in its transport subscription. */
        fireSlideAction(ev.id);
        break;
      case "toggle":
        set({ [ev.key]: ev.on } as Partial<ShowState>);
        break;
      case "timer":
        set({ timerEndsAt: ev.endsAt });
        break;
      case "reaction": {
        const r = { id: ev.id, emoji: ev.emoji };
        set((s) => ({
          reactions: [...s.reactions.slice(-59), r],
          reactionCounts: {
            ...s.reactionCounts,
            [ev.emoji]: (s.reactionCounts[ev.emoji] ?? 0) + 1,
          },
        }));
        setTimeout(() => {
          set((s) => ({ reactions: s.reactions.filter((x) => x.id !== r.id) }));
        }, 4600);
        break;
      }
      case "vote":
        set((s) => ({
          votes: { ...s.votes, [ev.option]: (s.votes[ev.option] ?? 0) + 1 },
        }));
        break;
      case "votes-reset":
        set({ votes: {} });
        break;
      case "survey":
        set((s) => ({ surveys: [...s.surveys, ev.row] }));
        break;
      case "override":
        set((s) => {
          const overrides = { ...s.overrides };
          if (ev.patch === null) delete overrides[ev.slideId];
          else overrides[ev.slideId] = ev.patch;
          return { overrides };
        });
        break;
      case "meta":
        set((s) => {
          const metaOv = { ...s.metaOv };
          if (ev.patch === null) delete metaOv[ev.slideId];
          else metaOv[ev.slideId] = { ...metaOv[ev.slideId], ...ev.patch };
          return { metaOv };
        });
        break;
      case "deck":
        set((s) => ({
          order: ev.order ?? s.order,
          hidden: ev.hidden ?? s.hidden,
        }));
        break;
      case "audio": {
        const cmd = ev.cmd;
        set((s) => {
          const a = { ...s.audio };
          if (cmd.kind === "gain") a[cmd.bus] = cmd.value;
          if (cmd.kind === "duck") a.duck = cmd.on;
          if (cmd.kind === "bed-start") a.bed = cmd.bed;
          if (cmd.kind === "bed-stop") a.bed = null;
          if (cmd.kind === "crossfade") a.bed = cmd.to;
          if (cmd.kind === "fade-seconds") a.fadeSeconds = cmd.seconds;
          return { audio: a };
        });
        break;
      }
      case "cam-hello":
        set((s) =>
          s.cams[ev.camId]
            ? s
            : {
                cams: {
                  ...s.cams,
                  [ev.camId]: { name: `CAM ${Object.keys(s.cams).length + 1}`, live: false },
                },
              },
        );
        break;
      case "cam-bye":
        set((s) => {
          const cams = { ...s.cams };
          delete cams[ev.camId];
          return { cams, activeCam: s.activeCam === ev.camId ? null : s.activeCam };
        });
        break;
      case "cam-status":
        set((s) => {
          const cur = s.cams[ev.camId];
          if (!cur || cur.live === ev.live) return s;
          return { cams: { ...s.cams, [ev.camId]: { ...cur, live: ev.live } } };
        });
        break;
      case "cam-active":
        set((s) => ({
          activeCam: ev.camId,
          /* cutting a camera in implies the broadcast system is on —
             otherwise the stage window stays invisible even when streaming */
          cameraOn: ev.camId ? true : s.cameraOn,
        }));
        break;
      case "cam-layout":
        set({ camLayout: ev.mode });
        break;
      case "tournament-score":
        set((s) => ({
          scores: {
            ...s.scores,
            [ev.cohortId]: Math.max(0, (s.scores[ev.cohortId] ?? 0) + ev.delta),
          },
        }));
        break;
      case "tournament-set":
        set({ scores: ev.scores });
        break;
      case "tournament-reset":
        set({ scores: { sec1: 0, sec2: 0, sec3: 0, sec4: 0 } });
        break;
      case "bgm-state":
        set({
          bgm: {
            playing: ev.playing,
            track: ev.track,
            artist: ev.artist,
            volume: ev.volume,
          },
        });
        break;
      case "bgm-cmd":
        break;
      case "lyric-state":
        set({
          lyric: ev.slideId
            ? {
                slideId: ev.slideId,
                song: ev.song,
                artist: ev.artist,
                manual: ev.manual,
                playing: ev.playing,
                line: ev.line,
                lines: ev.lines,
                section: ev.section,
              }
            : null,
        });
        break;
      case "lyric-cmd":
        /* the lyric slide handles this itself via the transport */
        break;
      default:
        break;
    }
    const s = get();
    try {
      localStorage.setItem(
        PERSIST_KEY,
        JSON.stringify({
          overrides: s.overrides,
          metaOv: s.metaOv,
          order: s.order,
          hidden: s.hidden,
          votes: s.votes,
          surveys: s.surveys,
        })
      );
    } catch {
      /* private mode etc. */
    }
  };

  return {
    ready: false,
    transportKind: "local",
    index: 0,
    dir: 1,
    blackout: false,
    cameraOn: false,
    camLayout: "pip",
    qrOn: true,
    pollOpen: false,
    surveyOpen: false,
    timerEndsAt: null,
    cams: {},
    activeCam: null,
    lyric: null,
    scores: persisted.scores ?? { sec1: 0, sec2: 0, sec3: 0, sec4: 0 },
    bgm: { playing: false, track: "September", artist: "Earth, Wind & Fire", volume: 0.35 },
    votes: {},
    reactionCounts: {},
    reactions: [],
    surveys: [],
    overrides: persisted.overrides ?? {},
    metaOv: persisted.metaOv ?? {},
    order: persisted.order ?? [],
    hidden: persisted.hidden ?? [],
    audio: { master: 0.9, music: 0.8, sfx: 0.9, duck: true, bed: null, fadeSeconds: 2 },
    init: () => {
      if (get().ready) return;
      const t = getTransport();
      t.subscribe((ev) => {
        if (seen.has(ev.id)) return;
        seen.add(ev.id);
        apply(ev);
      });
      /* live link status - the badge must reflect reality as connections
         come and go, not a snapshot from page load */
      t.onStatus((kind) => set({ transportKind: kind }));
      set({ ready: true, transportKind: t.kind });
    },

    dispatch: (partial) => {
      const ev = { ...partial, id: newEventId(), ts: Date.now() } as ShowEvent;
      seen.add(ev.id);
      apply(ev);
      getTransport().publish(ev);
    },
  };
});

/* ---------------- helpers ---------------- */

/* deep-merge runtime overrides over a slide's file content */
function deepMerge<T>(base: T, patch: unknown): T {
  if (
    patch === null ||
    typeof patch !== "object" ||
    Array.isArray(patch) ||
    typeof base !== "object" ||
    base === null ||
    Array.isArray(base)
  ) {
    return patch === undefined ? base : (patch as T);
  }
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
    out[k] = deepMerge((base as Record<string, unknown>)[k], v);
  }
  return out as T;
}

export function useSlideContent<T>(slideId: string, defaults: T): T {
  const ov = useShow((s) => s.overrides[slideId]);
  return useMemo(() => deepMerge(defaults, ov ?? {}), [defaults, ov]);
}
