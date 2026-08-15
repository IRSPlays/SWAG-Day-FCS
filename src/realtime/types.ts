/* The realtime event protocol of the whole show.
   Every machine (stage, controller, audience phones, camera) speaks this. */

export type Dir = 1 | -1;

export type AudioCmd =
  | { kind: "gain"; bus: "master" | "music" | "sfx"; value: number }
  | { kind: "duck"; on: boolean }
  | { kind: "bed-start"; bed: "A" | "B" }
  | { kind: "bed-stop" }
  | { kind: "crossfade"; to: "A" | "B"; seconds: number }
  | { kind: "fade-seconds"; seconds: number }
  | { kind: "sfx"; id: string };

export interface SurveyRow {
  /** 1–4 rating */
  q1: number;
  /** favourite moment */
  q2: string;
  /** one word for the teachers */
  q3: string;
  ts: number;
}

type Base = { id: string; ts: number };

export type ShowEvent =
  | (Base & { type: "cue"; index: number; dir: Dir })
  | (Base & {
      type: "toggle";
      key: "blackout" | "cameraOn" | "qrOn" | "pollOpen" | "surveyOpen";
      on: boolean;
    })
  | (Base & { type: "timer"; endsAt: number | null })
  | (Base & { type: "reaction"; emoji: string })
  | (Base & { type: "vote"; option: string })
  | (Base & { type: "votes-reset" })
  | (Base & { type: "survey"; row: SurveyRow })
  | (Base & { type: "override"; slideId: string; patch: Record<string, unknown> | null })
  | (Base & { type: "meta"; slideId: string; patch: Record<string, unknown> | null })
  | (Base & { type: "deck"; order?: string[]; hidden?: string[] })
  | (Base & { type: "audio"; cmd: AudioCmd })
  /* WebRTC camera signaling — multi-camera: every message is tagged with the
     phone's camId so several phones can stream into the stage at once. */
  | (Base & { type: "cam-hello"; camId: string })
  | (Base & { type: "cam-bye"; camId: string })
  | (Base & { type: "cam-request" })
  | (Base & { type: "cam-offer"; camId: string; sdp: RTCSessionDescriptionInit })
  | (Base & { type: "cam-answer"; camId: string; sdp: RTCSessionDescriptionInit })
  | (Base & { type: "cam-ice"; from: "phone" | "stage"; camId: string; candidate: RTCIceCandidateInit })
  /* the controller selects which phone is cut to the stage screen */
  | (Base & { type: "cam-active"; camId: string | null })
  /* stage flagging that a camera's video is actually flowing */
  | (Base & { type: "cam-status"; camId: string; live: boolean });

export const newEventId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** what you hand to dispatch() — id/ts are stamped automatically */
export type ShowEventInput = DistributiveOmit<ShowEvent, "id" | "ts">;
