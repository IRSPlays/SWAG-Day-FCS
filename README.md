# SWAG DAY FS — Stage Production System

Full-stack, web-based presentation & stage production system for school events.
**Event build:** Teachers' Day '26 — *Suit up! Show up! Sport it up!* (sport-day visual theme, palette engineered to cut through yellow stage light).

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000 → PREVIEW
```

## Architecture (strict separation by design)

| Folder | Purpose | Rule |
|---|---|---|
| `src/slides/` | Slide **content** — one file per slide | Only content + meta lives here. Quick edits never touch motion code. |
| `src/transitions/` | Slide-to-slide transitions | Separate files, registered by id. Slides reference them by id only. |
| `src/animations/` | Reusable motion effects (letter stagger, scoreboard flip, …) | Separate files; slides compose them. |
| `src/layouts/` | Slide shell + broadcast primitives (ticker, live bug, corner ticks) | |
| `src/engine/` | Scaled 1920×1080 broadcast frame + deck player | |
| `src/motion/` | Choreography tokens (easings, springs, stagger math) | |

## Build roadmap

- [x] **01** Scaffold + design tokens (anti-yellow-light palette: volt cyan / hot magenta / ultraviolet on violet-black · Anton / Instrument Serif / Space Grotesk)
- [x] **02** Reference deck + mograph transitions → `/preview`
- [x] **03** Stage output + keyboard nav + blackout → `/stage`
- [x] **04** Realtime sync (`/controller` ⇄ `/stage` · BroadcastChannel locally, our own WebSocket hub cross-device)
- [x] **05** Audio mixer (procedural Web-Audio beds, crossfader, SFX pads, ducking — zero audio files)
- [x] **06** Manual editor with live overrides → `/editor`
- [x] **07** Audience mobile view: QR, emoji storms, live votes → `/audience`
- [x] **08** Camera streaming: multi-camera phone → stage (WebRTC, flip/zoom on the phone, controller picks the broadcast source) → `/camera`
- [x] **09** End-of-show survey + analytics → `/report`
- [ ] **10** Railway deploy

## How to run the show (local rehearsal)

1. `npm run dev`
2. **Stage PC:** open `/stage`, click **ARM STAGE** (browser audio gesture), press **F** for fullscreen.
3. **Controller PC:** open `/controller` — drive slides, blackout, timers, voting, survey, camera and the mixer.
4. **Phones:** scan the QR → `/audience` — reactions fly onto the stage, votes and survey flow in.
5. **Camera phone:** `/audience` → *GO LIVE ON THE STAGE SCREEN* (or `/camera` directly), then the controller hits **STAGE CAM**.
6. **Lyric operator phone:** `/lyrics` — wakes up when a lyric slide hits the stage; NEXT taps the lines along.

Keyboard on `/stage`: ← → / SPACE navigate · ESC or B blackout · C camera · Q QR badge · F fullscreen.
Keyboard on `/controller`: ← → navigate · B blackout · 1–6 SFX pads.
Keyboard on a lyric slide: P play/pause track · ↓/↑ next/prev line · R restart.

## Going cross-device (Railway — our own server)

1. Deploy to Railway (framework: Node, start command `npm run build && npm start` — `npm start` runs `server.js`, one instance).
2. The start command MUST run `server.js` (i.e. `npm start`). A bare `next start` serves the pages but silently kills the realtime hub — cameras will show `LINK: LOCAL` forever.
3. Realtime runs on our own WebSocket hub at `/api/ws` (same server as the app). Networks that block WebSocket upgrades fall back automatically to HTTP polling (`/api/ws-send` + `/api/ws-poll`) — if the page loads, the show syncs. No third-party keys needed.
4. If the server is unreachable entirely, the system still works — synced across tabs of one browser via BroadcastChannel.

## Camera streaming across different networks (TURN)

Camera signaling rides the hub over HTTPS/WS, so a phone can *register* from any network — but the **video** itself is peer-to-peer WebRTC. STUN only punches through friendly NATs. Between different networks (a phone on cellular CGNAT, the stage on client-isolated venue Wi-Fi) the ICE checks never complete and the feed stays black. A **TURN relay** carries the media whenever direct P2P is impossible.

Both peers share the ICE list from `src/realtime/rtc.ts`, which reads these env vars on the server:

| Var | What |
|---|---|
| `NEXT_PUBLIC_TURN_URLS` | Comma-separated TURN URLs, e.g. `turn:myapp.up.railway.app:3478,turn:myapp.up.railway.app:443?transport=tcp` |
| `NEXT_PUBLIC_TURN_USERNAME` | TURN username |
| `NEXT_PUBLIC_TURN_CREDENTIAL` | TURN credential |

With none set, the code falls back to the public **OpenRelay** test relay (so cross-network rehearsal works out of the box) and logs a console warning. **That relay is rehearsal-grade only — media transits a third party.** Stand up your own [coturn](https://github.com/coturn/coturn) and set the three env vars before show day.

To confirm TURN is actually in use: on the phone `/camera` page, check the HUD — if ICE reaches `connected`/`completed` across different networks, the relay is carrying the media.

