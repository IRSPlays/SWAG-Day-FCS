/* Transport layer.
   - With NEXT_PUBLIC_SUPABASE_URL + ANON_KEY set: Supabase Realtime broadcast
     (cross-device — phones, controller PC and stage PC on different machines).
   - Without keys: BroadcastChannel (same browser, multiple tabs/windows —
     perfect for rehearsing on one laptop).
   The rest of the app never knows which one it got. */

import { createClient } from "@supabase/supabase-js";
import type { ShowEvent } from "./types";

export interface Transport {
  kind: "local" | "supabase";
  publish: (ev: ShowEvent) => void;
  subscribe: (cb: (ev: ShowEvent) => void) => () => void;
}

let instance: Transport | null = null;

export function getTransport(): Transport {
  if (instance) return instance;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  instance = url && key ? supabaseTransport(url, key) : localTransport();
  return instance;
}

/* ---------------- local (same browser) ---------------- */

function localTransport(): Transport {
  const channel =
    typeof BroadcastChannel !== "undefined"
      ? new BroadcastChannel("swag-day-fs-show")
      : null;
  return {
    kind: "local",
    publish: (ev) => channel?.postMessage(ev),
    subscribe: (cb) => {
      if (!channel) return () => {};
      const h = (e: MessageEvent) => cb(e.data as ShowEvent);
      channel.addEventListener("message", h);
      return () => channel.removeEventListener("message", h);
    },
  };
}

/* ---------------- supabase (cross-device) ---------------- */

function supabaseTransport(url: string, key: string): Transport {
  const client = createClient(url, key);
  const channel = client.channel("show-sync", {
    config: { broadcast: { self: false } },
  });
  const handlers = new Set<(ev: ShowEvent) => void>();
  channel.on("broadcast", { event: "show" }, (msg) => {
    const ev = msg.payload as ShowEvent;
    handlers.forEach((h) => h(ev));
  });
  void channel.subscribe();
  return {
    kind: "supabase",
    publish: (ev) => {
      void channel.send({ type: "broadcast", event: "show", payload: ev });
    },
    subscribe: (cb) => {
      handlers.add(cb);
      return () => handlers.delete(cb);
    },
  };
}
