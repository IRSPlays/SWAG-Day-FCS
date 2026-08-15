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
    };
    return instance;
  }
  instance = serverTransport();
  return instance;
}

function serverTransport(): Transport {
  const handlers = new Set<(ev: ShowEvent) => void>();
  const queue: ShowEvent[] = [];
  let online = false;

  /* same-browser backup for when the server can't be reached */
  const channel =
    typeof BroadcastChannel !== "undefined"
      ? new BroadcastChannel("swag-day-fs-show")
      : null;
  channel?.addEventListener("message", (e) => {
    const ev = e.data as ShowEvent;
    handlers.forEach((h) => h(ev));
  });

  /* downstream: server-sent events */
  const es = new EventSource("/api/rt");
  es.onopen = () => {
    online = true;
    const pending = queue.splice(0);
    pending.forEach((ev) => void post(ev));
  };
  es.onerror = () => {
    /* EventSource auto-reconnects; while down we fall back to the channel */
    online = false;
  };
  es.onmessage = (e) => {
    try {
      const ev = JSON.parse(e.data as string) as ShowEvent;
      handlers.forEach((h) => h(ev));
    } catch {
      /* keep-alive comment or malformed frame - ignore */
    }
  };

  /* upstream: POST (carries WebRTC SDP/ICE payloads reliably) */
  const post = (ev: ShowEvent) =>
    fetch("/api/rt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ev),
      keepalive: true,
    }).catch(() => {
      /* server unreachable -> same-browser delivery only */
      channel?.postMessage(ev);
    });

  return {
    get kind() {
      return online ? "server" : "local";
    },
    publish: (ev) => {
      if (!online) {
        queue.push(ev);
        if (queue.length > 200) queue.shift();
        channel?.postMessage(ev);
        return;
      }
      void post(ev);
    },
    subscribe: (cb) => {
      handlers.add(cb);
      return () => handlers.delete(cb);
    },
  };
}