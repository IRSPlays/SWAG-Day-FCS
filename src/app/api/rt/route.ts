/* /api/rt - OUR OWN realtime hub (Railway server, no third-party service).
   GET  -> Server-Sent Events stream: every connected client (stage PC,
           controller PC, phones) receives every show event instantly.
   POST -> publish an event; the server fans it out to all subscribers.
   This carries deck cues, lyric commands, WebRTC camera signaling
   (offers/answers/ICE), reactions, votes - the whole show protocol.
   Single-instance deployment (Railway default) = one global client set. */

import { NextResponse, type NextRequest } from "next/server";

type Client = { send: (chunk: string) => void };

const g = globalThis as unknown as { __rtClients?: Set<Client> };
if (!g.__rtClients) g.__rtClients = new Set<Client>();
const clients = g.__rtClients;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const encoder = new TextEncoder();
  let client: Client | null = null;
  let keepAlive: ReturnType<typeof setInterval> | null = null;

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
      /* keep the connection warm through Railway's proxy idle timeout */
      keepAlive = setInterval(() => client?.send(": ping\n\n"), 20000);
    },
    cancel() {
      if (keepAlive) clearInterval(keepAlive);
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
  return NextResponse.json({ ok: true, clients: clients.size });
}