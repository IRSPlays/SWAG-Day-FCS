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
- [ ] **03** Stage output + keyboard nav + blackout → `/stage`
- [ ] **04** Realtime sync (`/controller` ⇄ `/stage`, Supabase Realtime)
- [ ] **05** Audio mixer (music A/B crossfader, SFX pads, ducking)
- [ ] **06** Manual editor with live overrides → `/editor`
- [ ] **07** Audience mobile view: QR, emoji storms, live votes → `/audience`
- [ ] **08** Camera streaming: phone → stage (WebRTC) → `/camera`
- [ ] **09** End-of-show survey + analytics → `/report`
- [ ] **10** Vercel deploy
