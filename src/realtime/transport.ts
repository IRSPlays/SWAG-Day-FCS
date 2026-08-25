/* Transport layer - OUR OWN hub (server.js on Railway), no third-party service.

 Dual-path, automatic:
 - Primary: native WebSocket at /api/ws - instant fan-out both ways.
 - Fallback: plain HTTP short-poll (/api/ws-send + /api/ws-poll, 400 ms)
   for proxies/networks that pass HTTP but kill WebSocket upgrades.
   The page itself loads over HTTP, so wherever the page renders, the
   fallback reaches the hub. Handoff is gap-free: WS frames carry a
   sequence number (__seq) the poller resumes from.
 - Offline rehearsal: BroadcastChannel mirrors same-browser traffic;
   event-id dedupe collapses every double delivery.

 The rest of the app never knows which path delivered. */

import type { ShowEvent } from "./types";

export interface Transport {
  kind: "local" | "server";
  publish: (ev: ShowEvent) => void;
  subscribe: (cb: (ev: ShowEvent) => void) => () => void;
  /** live link status - fires whenever the server link opens or drops */
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
     BroadcastChannel mirror, or WS + poll overlap) - deliver exactly once */
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

  /* same-browser fallback when the server can't be reached at all */
  const channel =
    typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("swag-day-fs-show") : null;
  if (channel) {
    channel.onmessage = (e) => {
      deliver(e.data as ShowEvent);
    };
  }

  type Mode = "deciding" | "ws" | "http";
  let mode: Mode = "deciding";
  let socket: WebSocket | null = null;
  let wsRetry = 0;
  let failTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let pollCursor: number | null = null; // null = not synced yet (head first, no history replay)
  let lastWsSeq = 0; // from __seq on WS frames - gap-free WS -> HTTP handoff
  const outbound: ShowEvent[] = [];

  const enqueueOutbound = (ev: ShowEvent) => {
    outbound.push(ev);
    if (outbound.length > 200) outbound.shift(); // bounded
  };

  const sendHttp = (ev: ShowEvent) => {
    void fetch("/api/ws-send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ev),
      keepalive: true,
    }).catch(() => {});
  };

  const sendActive = (ev: ShowEvent) => {
    if (mode === "ws" && socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(ev));
      return;
    }
    sendHttp(ev);
  };

  const flushOutbound = () => {
    const queued = outbound.splice(0);
    for (const ev of queued) sendActive(ev);
  };

  const pollTick = async () => {
    try {
      const q = pollCursor === null ? "head" : String(pollCursor);
      const res = await fetch(`/api/ws-poll?since=${q}`, { cache: "no-store" });
      const data = (await res.json()) as { events?: ShowEvent[]; seq?: number };
      if (typeof data.seq === "number") pollCursor = data.seq;
      for (const ev of data.events ?? []) deliver(ev);
      setStatus(true);
    } catch {
      /* server unreachable this tick - keep polling */
    }
  };

  const goHttp = (fromSeq: number | null) => {
    if (mode === "http") return;
    mode = "http";
    if (pollCursor === null) pollCursor = fromSeq; // null -> head-sync (no replay)
    if (!pollTimer) {
      pollTimer = setInterval(() => void pollTick(), 400);
      void pollTick();
    }
    setStatus(true);
    flushOutbound();
  };

  const openWs = () => {
    if (
      socket &&
      (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)
    )
      return;
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    socket = new WebSocket(`${proto}//${window.location.host}/api/ws`);

    /* decision window: handshake not done in 4s -> this path probably
       kills upgrades; fall back to HTTP polling */
    failTimer = setTimeout(() => {
      try {
        socket?.close();
      } catch {}
    }, 4000);

    socket.onopen = () => {
      if (failTimer) clearTimeout(failTimer);
      wsRetry = 0;
      mode = "ws";
      setStatus(true);
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
      flushOutbound();
    };

    socket.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data as string) as ShowEvent & { __seq?: number };
        if (typeof parsed.__seq === "number") lastWsSeq = parsed.__seq;
        deliver(parsed);
      } catch {
        /* malformed frame - ignore */
      }
    };

    socket.onclose = () => {
      if (failTimer) clearTimeout(failTimer);
      const hadOpened = mode === "ws";
      socket = null;
      if (!hadOpened && mode === "deciding") {
        goHttp(null); // WS unusable on this network - stay on HTTP permanently
        return;
      }
      /* a working WS dropped: bridge with HTTP while it reconnects */
      goHttp(lastWsSeq > 0 ? lastWsSeq : null);
      const wait = Math.min(1000 * 2 ** wsRetry, 8000);
      wsRetry += 1;
      reconnectTimer = setTimeout(openWs, wait);
    };

    socket.onerror = () => {
      try {
        socket?.close();
      } catch {}
    };
  };

  openWs();

  return {
    get kind() {
      return online ? "server" : "local";
    },
    publish: (ev) => {
      if (mode === "ws" && socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(ev));
        return;
      }
      if (mode === "http") {
        sendHttp(ev);
        return;
      }
      enqueueOutbound(ev); // still deciding which path wins
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
