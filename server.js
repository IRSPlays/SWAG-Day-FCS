/* server.js - SWAG DAY FS production/dev server.

 Next.js alone cannot own a WebSocket, so this custom server hosts BOTH:
 - the Next.js app (pages, static, everything HTTP), and
 - the show realtime hub: a native WebSocket server on /api/ws PLUS an
   HTTP fallback pair on /api/ws-send + /api/ws-poll.

 One process owns every connected client (stage PC, controller PC,
 phones) - there is no shared-state boundary left to break.

 Why an HTTP fallback: some proxies and school networks pass plain HTTP
 but kill WebSocket upgrades. The page itself loads over HTTP, so if a
 phone can render /camera at all, /api/ws-send + /api/ws-poll WILL reach
 this hub. The transport falls back automatically; healthy networks
 stay instant via WS. */

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { WebSocketServer } = require("ws");

const dev = process.argv.includes("--dev");
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  /* ---- hub state: single source of truth ---- */
  const clients = new Set();
  const history = []; // { seq, ev } - bounded ring for HTTP fallback catch-up
  const HISTORY_MAX = 800;
  let seqCounter = 0;

  const publishEvent = (ev) => {
    seqCounter += 1;
    history.push({ seq: seqCounter, ev });
    if (history.length > HISTORY_MAX) history.shift();
    /* __seq rides along so clients resuming on HTTP never miss a beat */
    const frame = JSON.stringify({ ...ev, __seq: seqCounter });
    for (const c of clients) {
      if (c.readyState === 1 /* OPEN */) c.send(frame);
    }
  };

  const readBody = (req) =>
    new Promise((resolve) => {
      let data = "";
      req.on("data", (chunk) => {
        data += chunk;
        if (data.length > 1e6) req.destroy(); // 1 MB cap - SDPs are ~20KB
      });
      req.on("end", () => resolve(data));
      req.on("error", () => resolve(""));
    });

  /* HTTP fallback endpoints - same process as the hub, zero isolation.
     POST /api/ws-send          -> publish an event
     GET  /api/ws-poll?since=N  -> { events, seq }; since="head" syncs only */
  const server = createServer(async (req, res) => {
    const { pathname, query } = parse(req.url, true);

    if (pathname === "/api/ws-send" && req.method === "POST") {
      const raw = await readBody(req);
      let ev = null;
      try {
        ev = JSON.parse(raw);
      } catch {}
      if (!ev || typeof ev.type !== "string") {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end('{"error":"bad event"}');
        return;
      }
      publishEvent(ev);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end('{"ok":true}');
      return;
    }

    if (pathname === "/api/ws-poll" && req.method === "GET") {
      const events = [];
      if (query.since !== "head") {
        const since = Number.parseInt(String(query.since ?? "0"), 10) || 0;
        for (let i = history.length - 1; i >= 0; i--) {
          if (history[i].seq <= since) break;
          events.unshift(history[i].ev);
        }
      }
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify({ events, seq: seqCounter }));
      return;
    }

    handle(req, res, parse(req.url, true));
  });

  /* ---- native WebSocket hub on /api/ws ---- */
  const wss = new WebSocketServer({ noServer: true });
  wss.on("connection", (socket) => {
    clients.add(socket);
    socket.isAlive = true;
    /* immediate proof-of-delivery frame - the client watchdog keys on it */
    socket.send(
      JSON.stringify({ id: "__hello", ts: Date.now(), type: "__hello", __seq: seqCounter }),
    );
    socket.on("pong", () => {
      socket.isAlive = true;
    });
    socket.on("message", (data) => {
      let ev;
      try {
        ev = JSON.parse(data.toString());
      } catch {
        return; // malformed frame - ignore
      }
      if (!ev || typeof ev.type !== "string") return;
      publishEvent(ev); // fan out to EVERYONE, sender echo included (transport dedupes)
    });
    socket.on("close", () => clients.delete(socket));
    socket.on("error", () => clients.delete(socket));
  });

  /* hub upgrades here; everything else (Next dev HMR) passes to Next */
  const nextUpgrade = app.getUpgradeHandler();
  server.on("upgrade", (req, socket, head) => {
    const { pathname } = parse(req.url, true);
    if (pathname === "/api/ws") {
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
    } else {
      nextUpgrade(req, socket, head);
    }
  });

  /* kill dead connections (phones that vanished mid-song) */
  const heartbeat = setInterval(() => {
    for (const c of clients) {
      if (c.isAlive === false) {
        clients.delete(c);
        c.terminate();
        continue;
      }
      c.isAlive = false;
      c.ping();
    }
  }, 30000);
  heartbeat.unref();

  server.listen(port, () => {
    console.log(`> SWAG DAY FS ready on http://localhost:${port} ${dev ? "(dev)" : ""}`);
  });
});
