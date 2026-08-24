/* Transport layer - OUR OWN SERVER (Railway), no third-party service.
   - Primary: the /api/rt hub on this deployment (SSE downstream + POST
     upstream). Cross-device by nature: phones, controller PC and stage PC
     all connect to the same server.
   - Fallback: BroadcastChannel (same browser) if the server is unreachable -
     handy for rehearsing on one laptop with no network.
   The rest of the app never knows which one it got. */

import type { ShowEvent } from "./types";

export interface Transport {
  kind: "local" | "server";
  publish: (ev: ShowEvent) => void;
  subscribe: (cb: (ev: ShowEvent) => void) => () => void;
  /** live link status â€” fires whenever the server link opens or drops */
  onStatus: (cb: (kind: "local" | "server") => void) => () => void;
}

let instance: Transport | null = null;

export function getTransport(): Transport {
  if (instance) return instance;
  if (typeof window === "undefined") {
    /* SSR - a silent stub; real use is always inside client effects */
    instance = {
      kind: "local",
      publish: () => {},
      subscribe: () => () => {},
      onStatus: () => () => {},
    };
    return instance;
  }
  instance = serverTransport();
  return instance;
}

function serverTransport(): Transport {
  const handlers = new Set<(ev: ShowEvent) => void>();
  const statusCbs = new Set<(kind: "local" | "server") => void>();
  let online = false;

  const setStatus = (up: boolean) => {
    if (up === online) return;
    online = up;
    statusCbs.forEach((cb) => cb(up ? "server" : "local"));
  };

  /* event-id dedupe: an event can arrive via BOTH the BroadcastChannel
     (same-browser mirror) and the server stream â€” deliver each exactly once */
  const seenIds = new Set<string>();
  const deliver = (ev: ShowEvent) => {
    if (!ev.id || seenIds.has(ev.id)) return;
    seenIds.add(ev.id);
    if (seenIds.size > 600) {
      for (const id of seenIds) {
        seenIds.delete(id);
        if (seenIds.size <= 400) break;
      }
    }
    handlers.forEach((h) => h(ev));
  };

  /* same-browser backup for when the server can't be reached */
  const channel =
    typeof BroadcastChannel !== "undefined"
      ? new BroadcastChannel("swag-day-fs-show")
      : null;
  channel?.addEventListener("message", (e) => {
    deliver(e.data as ShowEvent);
  });

  /* downstream: server-sent events */
  const es = new EventSource("/api/rt");
  es.onopen = () => {
    setStatus(true);
  };
  es.onerror = () => {
    /* EventSource auto-reconnects; while down we run on the channel */
    setStatus(false);
  };
  es.onmessage = (e) => {
    try {
      deliver(JSON.parse(e.data as string) as ShowEvent);
    } catch {
      /* keep-alive comment or malformed frame - ignore */
    }
  };

  /* upstream: POST (carries WebRTC SDP/ICE payloads reliably).
     ALWAYS posted, even before the SSE stream opens â€” a slow-opening stream
     must never stall cross-device signaling. */
  const post = (ev: ShowEvent) =>
    fetch("/api/rt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ev),
    });

  return {
    get kind() {
      return online ? "server" : "local";
    },
    publish: (ev) => {
      if (!online) {
        /* server link not confirmed yet: mirror locally right away (zero
           latency for same-browser rehearsal) AND fire the POST regardless â€”
           remote devices get it from the server even if our SSE is still
           handshaking. dedupe guarantees no double delivery. */
        channel?.postMessage(ev);
      }
      void post(ev).catch(() => {
        /* server truly unreachable -> same-browser delivery only */
        channel?.postMessage(ev);
      });
    },
    subscribe: (cb) => {
      handlers.add(cb);
      return () => handlers.delete(cb);
    },
    onStatus: (cb) => {
      statusCbs.add(cb);
      cb(online ? "server" : "local");
      return () => statusCbs.delete(cb);
    },
  };
}
