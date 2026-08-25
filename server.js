/* server.js — SWAG DAY FS production/dev server.

   Next.js alone cannot own a WebSocket, so this custom server hosts BOTH:
   - the Next.js app (pages, API), and
   - the show realtime hub: a native WebSocket server on /api/ws.

   One process owns every connected client (stage PC, controller PC,
   phones) and fans each event out instantly to all of them. This replaces
   the old SSE+POST hub whose module state was split across handler
   contexts — the root cause of dead cross-device signaling.

   Run:  npm run dev  (node server.js --dev)
         npm start    (node server.js) */

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { WebSocketServer } = require("ws");

const dev = process.argv.includes("--dev");
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res, parse(req.url, true));
  });

  /* ---- the show hub ---- */
  const wss = new WebSocketServer({ noServer: true });
  const clients = new Set();

  wss.on("connection", (socket) => {
    clients.add(socket);
    socket.isAlive = true;
    socket.on("pong", () => {
      socket.isAlive = true;
    });
    socket.on("message", (data) => {
      /* validate the show protocol: JSON object with a string `type` */
      let ev;
      try {
        ev = JSON.parse(data.toString());
      } catch {
        return;
      }
      if (!ev || typeof ev.type !== "string") return;
      const frame = JSON.stringify(ev);
      for (const c of clients) {
        if (c.readyState === 1 /* WebSocket.OPEN */) c.send(frame);
      }
    });
    socket.on("close", () => clients.delete(socket));
    socket.on("error", () => clients.delete(socket));
  });

  /* heartbeat: drop phones that vanished from Wi-Fi without a close frame */
  const heartbeat = setInterval(() => {
    for (const c of clients) {
      if (c.isAlive === false) {
        c.terminate();
        clients.delete(c);
        continue;
      }
      c.isAlive = false;
      try {
        c.ping();
      } catch {
        /* terminating anyway next round */
      }
    }
  }, 30000);
  if (heartbeat.unref) heartbeat.unref();

  server.on("upgrade", (req, socket, head) => {
    const { pathname } = parse(req.url, true);
    if (pathname === "/api/ws") {
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
    } else {
      /* everything else (Next dev HMR websocket etc.) goes to Next */
      try {
        const upgradeHandler = app.getUpgradeHandler();
        upgradeHandler(req, socket, head);
      } catch {
        socket.destroy();
      }
    }
  });

  server.listen(port, () => {
    console.log(`> SWAG DAY FS ready on http://localhost:${port}${dev ? "  (dev)" : ""}`);
  });
});
