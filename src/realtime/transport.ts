/* Transport layer - OUR OWN WEBSOCKET HUB (server.js), no third-party service.
   - Primary: native WebSocket at /api/ws on this deployment. One server
     process owns every client (stage PC, controller PC, phones) and fans
     every event out instantly. No SSE buffering, no polling, no
     shared-module-state pitfalls.
   - Fallback: BroadcastChannel (same browser) when the server is
     unreachable - handy for rehearsing on one laptop with no network.
   Publishes made while the socket is down are queued and flushed on reopen.
   The rest of the app never knows which path delivered. */

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
  instance = wsTransport();
  return instance;
}

function wsTransport(): Transport {
  const handlers = new Set<(ev: ShowEvent) => void>();
  const statusCbs = new Set<(kind: "local" | "server") => void>();
  let online = false;

  const setStatus = (up: boolean) => {
    if (online === up) return;
    online = up;
    statusCbs.forEach((cb) => cb(up ? "server" : "local"));
  };

  /* event-id dedupe: an event can arrive twice (socket echo + offline
     BroadcastChannel mirror) - deliver each exactly once */
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

  let socket: WebSocket | null = null;
  let retry = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  const outbound: ShowEvent[] = [];

  const connect = () => {
    if (
      socket &&
      (socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    socket = new WebSocket(`${proto}//${window.location.host}/api/ws`);

    socket.onopen = () => {
      retry = 0;
      setStatus(true);
      /* flush everything queued while the link was down */
      for (const ev of outbound.splice(0)) {
        try {
          socket?.send(JSON.stringify(ev));
        } catch {
          /* socket died again - reconnect loop takes over */
        }
      }
    };

    socket.onmessage = (e) => {
      try {
        deliver(JSON.parse(e.data as string) as ShowEvent);
      } catch {
        /* malformed frame - ignore */
      }
    };

    socket.onclose = () => {
      setStatus(false);
      const wait = Math.min(500 * 2 ** retry, 4000);
      retry += 1;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connect, wait);
    };

    socket.onerror = () => {
      try {
        socket?.close();
      } catch {
        /* close handler schedules the reconnect */
      }
    };
  };

  connect();

  return {
    get kind() {
      return online ? "server" : "local";
    },
    publish: (ev) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(ev));
        return;
      }
      /* link down: mirror same-browser instantly AND queue for the server */
      channel?.postMessage(ev);
      outbound.push(ev);
      if (outbound.length > 200) outbound.shift();
      connect();
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
