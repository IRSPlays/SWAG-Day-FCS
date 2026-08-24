/* /api/rt - OUR OWN realtime hub (Railway server, no third-party service).
   GET  -> Server-Sent Events stream: every connected client (stage PC,
           controller PC, phones) receives every show event instantly.
   POST -> publish an event; the server fans it out to all subscribers.
   This carries deck cues, lyric commands, WebRTC camera signaling
   (offers/answers/ICE), reactions, votes - the whole show protocol.

   WHY THE FILE BUS: route-handler module state (globalThis) is NOT shared
   between handler contexts in dev (Turbopack isolates them) — which silently
   split SSE subscribers from POST publishers: signaling worked in one browser
   (BroadcastChannel masked it) and died across devices. Every event is now
   ALSO appended to a JSONL bus file that each SSE connection tails, so
   delivery survives any process/context topology. The client transport's
   event-id dedupe collapses the double delivery. In-memory fan-out remains
   for instant same-process delivery. */

import { NextResponse, type NextRequest } from "next/server";
import { promises as fsp } from "fs";
import path from "path";

type Client = { send: (chunk: string) => void };

const g = globalThis as unknown as { __rtClients?: Set<Client> };
if (!g.__rtClients) g.__rtClients = new Set<Client>();
const clients = g.__rtClients;

/* cross-context event bus (gitignored, bounded, best-effort) */
const BUS_FILE = path.join(process.cwd(), ".rt-bus.jsonl");
const BUS_POLL_MS = 200;
const BUS_MAX_BYTES = 1_000_000;
const BUS_KEEP_LINES = 120;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function busAppend(ev: unknown) {
  try {
    await fsp.appendFile(BUS_FILE, JSON.stringify(ev) + "\n", "utf8");
    /* keep the bus bounded — rotate when it grows past the cap */
    const st = await fsp.stat(BUS_FILE).catch(() => null);
    if (st && st.size > BUS_MAX_BYTES) {
      const data = await fsp.readFile(BUS_FILE, "utf8").catch(() => "");
      const tail = data.split("\n").filter(Boolean).slice(-BUS_KEEP_LINES);
      await fsp.writeFile(BUS_FILE, tail.length ? tail.join("\n") + "\n" : "", "utf8");
    }
  } catch {
    /* bus is best-effort; in-memory fan-out already ran */
  }
}

export async function GET() {
  const encoder = new TextEncoder();
  let client: Client | null = null;
  let keepAlive: ReturnType<typeof setInterval> | null = null;
  let busTimer: ReturnType<typeof setInterval> | null = null;
  let busOffset = 0;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      client = {
        send: (chunk) => {
          try {
            controller.enqueue(encoder.encode(chunk));
          } catch {
            /* client hung up - the cancel() below cleans up */
          }
        },
      };
      clients.add(client);
      /* SSE needs an initial comment byte to flush headers through proxies */
      client.send(": connected\n\n");
      keepAlive = setInterval(() => client?.send(": ping\n\n"), 20000);

      /* tail the cross-context bus: deliver anything this process's
         in-memory set did not already fan out (duplicates are collapsed
         client-side by event-id dedupe) */
      busTimer = setInterval(() => {
        void (async () => {
          try {
            const st = await fsp.stat(BUS_FILE);
            if (st.size < busOffset) busOffset = 0; /* rotated/truncated */
            if (st.size === busOffset) return;
            const fh = await fsp.open(BUS_FILE, "r");
            try {
              const len = st.size - busOffset;
              const buf = Buffer.allocUnsafe(len);
              await fh.read(buf, 0, len, busOffset);
              const text = buf.toString("utf8");
              const lastNl = text.lastIndexOf("\n");
              if (lastNl === -1) return; /* partial line - wait for the rest */
              busOffset += Buffer.byteLength(text.slice(0, lastNl + 1), "utf8");
              for (const line of text.slice(0, lastNl).split("\n")) {
                if (!line.trim()) continue;
                try {
                  const ev = JSON.parse(line);
                  client?.send(`data: ${JSON.stringify(ev)}\n\n`);
                } catch {
                  /* torn/malformed line - skip */
                }
              }
            } finally {
              await fh.close();
            }
          } catch {
            /* bus file not created yet - nothing published so far */
          }
        })();
      }, BUS_POLL_MS);
    },
    cancel() {
      if (keepAlive) clearInterval(keepAlive);
      if (busTimer) clearInterval(busTimer);
      if (client) clients.delete(client);
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function POST(req: NextRequest) {
  const ev = await req.json().catch(() => null);
  if (!ev || typeof ev.type !== "string") {
    return NextResponse.json({ error: "bad event" }, { status: 400 });
  }
  const chunk = `data: ${JSON.stringify(ev)}\n\n`;
  for (const c of clients) {
    c.send(chunk);
  }
  /* cross-context delivery — survives worker/context isolation */
  void busAppend(ev);
  return NextResponse.json({ ok: true, clients: clients.size });
}
