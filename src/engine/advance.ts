"use client";

/* Universal advance engine — ONE key drives the whole show.
   The active slide may claim the advance: lyric slides use it word-by-word
   (live bands) or to start their backing track, game slides use it to
   reveal answers. If no slide claims it, the deck moves to the next cue.

   Stage key handler: fireSlideAction() first, else cue+1.
   Controller: dispatches an "advance" event over the hub; the stage runs
   the same fireSlideAction-else-cue logic in its transport subscription. */

import { createContext, useContext, useEffect, useRef } from "react";

type SlideAction = () => boolean;

let handler: SlideAction | null = null;
let owner: object | null = null;
/* event ids this client has already consumed — the store applies the
   slide action for every "advance" event, and the stage's transport
   subscription checks the same event again for the cue fallback. */
const consumedIds = new Set<string>();

export function setSlideAction(fn: SlideAction | null, token: object) {
  /* ownership-aware: during a slide TRANSITION both slides are mounted
     (AnimatePresence runs the exit). The incoming slide registers first,
     then the leaving slide unmounts — its cleanup must NOT wipe the new
     owner, or fast presses would fall through to the next cue. */
  owner = token;
  handler = fn;
}

export function clearSlideAction(token: object) {
  if (owner === token) {
    owner = null;
    handler = null;
  }
}

/** true = the active slide consumed (or has already consumed) this advance.
    Pass the event id so the cue-fallback on stage never double-fires. */
export function fireSlideAction(eventId?: string): boolean {
  if (!handler) return false;
  if (eventId) {
    if (consumedIds.has(eventId)) return true;
    const ok = handler();
    if (ok) {
      consumedIds.add(eventId);
      if (consumedIds.size > 100) {
        const first = consumedIds.values().next().value;
        if (first !== undefined) consumedIds.delete(first);
      }
    }
    return ok;
  }
  return handler();
}

/** Slides call this with their advance handler; registration tracks the
    active render so unmounting automatically hands control back — but a
    leaving slide can never steal ownership from its replacement. */
export function useSlideAction(fn: SlideAction | null | undefined) {
  const token = useRef({}).current;
  useEffect(() => {
    if (!fn) return;
    setSlideAction(fn, token);
    return () => clearSlideAction(token);
  });
}

/* Muted-monitor context: the controller renders slides for preview but
   must NEVER emit audio. Slides that can play sound read this. */
const MuteContext = createContext(false);

export const MuteProvider = MuteContext.Provider;

export const useMuted = () => useContext(MuteContext);
