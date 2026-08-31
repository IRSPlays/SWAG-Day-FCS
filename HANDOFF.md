# SWAG DAY FCS — Handoff Document

Teachers' Day '26 stage production system · theme: "Suit up! Show up! Sport it up!"
Handoff date: 2026-08-28

## What this is

A full-stack show-control system for a school Teachers' Day concert:

- A **deck of animated slides** projected on the hall screen (`/stage`), piloted from an operator console (`/controller`).
- A **WebGL-style lyric engine** (`am-lyrics`) for the 4 song performances, driven manually from `/lyrics` on a second device.
- **Phones join the show**: audience reactions/votes/survey (`/audience`), phone cameras become stage video feeds (`/camera` → watched at `/camera-ops`, cut into the stage at `/controller`).
- **Realtime glue**: a custom Node server (`server.js`) hosts BOTH the Next.js app and a WebSocket hub (`/api/ws`) plus an HTTP fallback pair (`/api/ws-send` + `/api/ws-poll`) for networks that kill WebSocket upgrades. One process owns all show state.

## Machine quirks (read first — they WILL bite)

1. **Global npm `omit=dev` is set on this machine.** Always install with `npm install --include=dev`, otherwise Tailwind/TypeScript devDependencies vanish and builds fail.
2. **The shell has `NODE_ENV=production` set globally.** This breaks Turbopack's devDependency resolution (`Cannot find module '@tailwindcss/postcss'`). Unset it for every dev/build command:
   ```bat
   set NODE_ENV= & npm run dev
   set NODE_ENV= & npm run build
   ```
3. **This project must NOT live inside OneDrive** — OneDrive's sync locks files and breaks builds (EPERM on `.next`). It was moved to `C:\Projects\SWAG Day FCS` on 2026-08-28. Don't move it back.

## Running it

```bat
npm install --include=dev        # first time / after pulling
set NODE_ENV= & npm run dev      # dev (server.js + next dev on :3000)
set NODE_ENV= & npm run build    # production build
npm start                        # production (server.js, use this on show day)
```

Show-day machines on the hall LAN reach the hub at `http://<stage-pc-ip>:3000`. Optional env: `NEXT_PUBLIC_TURN_URLS` for the camera WebRTC links — unset, it falls back to a public OpenRelay relay (fine for rehearsal, configure your own TURN for the real show).

## Routes

| Route        | Machine    | Purpose                                          |
|--------------|-----------|--------------------------------------------------|
| `/`          | any       | Index / launcher poster                          |
| `/preview`   | operator  | Reference deck viewer + motion sandbox           |
| `/stage`     | stage PC  | THE projector output (fullscreen, keyboard-driven) |
| `/controller`| operator | "Start Tree" console: muted program monitor, cue-tree lamps, GO/arrow advance, blackout, cams, timers |
| `/editor`    | operator  | Live-edit slide content (JSON tree per slide)    |
| `/lyrics`    | operator  | Manual lyric console for the 4 performances      |
| `/audience`  | phones    | Reactions, votes, survey                         |
| `/camera`    | phones    | Phone → stage camera feed                        |
| `/camera-ops`| operator  | Camera operator console                          |
| `/report`    | operator  | Post-event analytics                             |

## Stage keyboard shortcuts

- `→` / `Space` / `PageDown` — next cue · `←` / `PageUp` — previous
- `B` or `Esc` — blackout (cuts to pure black, again to return)
- `C` — toggle camera overlay · `F` — fullscreen
- First click on `/stage` "ARM" — required to unlock audio autoplay

## How the deck works (where to edit things)

- **Slides are files**: `src/slides/slides/NN-name.tsx`. Each exports `meta` (id, title, transition, notes, accent) and `content` (editable copy) plus the component. `meta.content` fields are what `/editor` edits live. Filenames may not match running order — `deck.ts` is the truth.
- **ONE-BUTTON SHOW CONTROL**: `→` (ArrowRight/Space) fires an `advance`. The ACTIVE SLIDE may claim it first via `useSlideAction` (`src/engine/advance.ts`): lyric slides word-step (live bands, no track) or start their backing track (track = clock, advance protected until it ends); game slides reveal answers; the cheer countdown steps 3-2-1. If unclaimed, the deck cues next. `/controller` dispatches `advance` events over the hub; the stage executes them.
- **Controller is MUTED**: it renders slides inside `MuteProvider` — it can never emit audio; the stage machine owns the PA.
- **SlideShell** (`src/layouts/SlideShell.tsx`) is the shared frame — grain, vignette, corner ticks, ticker band. All non-performance slides render through it in **light mode**.
- **Performance slides** wrap `LyricsMograph` and stay **dark** by design — `LyricsMograph` paints its own opaque backdrop. Covers live in `public/covers/`. Acts with backing tracks (Ditto, Flashlight, Untuk Dia, Xiang Rui's Still Into You) pass `audio` — the RIGHT ARROW starts the track once, then the track is the clock. **Live bands (Lunar6tactics·Pulang, Rayyan Group·Everlong, final band·The Nights) run the same lyric slide with NO audio: the right arrow lights lyrics word by word.** All song mappings came from the video-submission form + old slide data; swap a band's song by editing that slide file (cover/ttml/sections all in-file). PSG Dance is an intro-card slide (no lyric engine).
- **Transitions** live separately in `src/transitions/`, text/letter animations in `src/animations/`.
- **Deck composition** is in `src/slides/` (deck list + types); slide content overrides from the editor flow through the store. Current order follows the 2026 EMCEE Script (NJ + Razan): opening → walkway → principal address → CTA + national awards (arrow reveals) → dedications filler → 6 performance acts → Guess Whose Desk game → final acts → 3-2-1 cheer → tribute → credits.
- **Fonts are self-hosted** (`src/app/fonts/*.woff2` via `next/font/local` in `layout.tsx`) — the build never touches fonts.googleapis.com, safe offline/proxied.

## Theming (important)

- Palette tokens are defined in `src/app/globals.css` `@theme`: royal blue `#4758d6` (`volt`), warm black `#201c1c` (`court`/`ice`), red `#ea3a3a` (`mag`), off-white `#eeeded` (`ice` on dark), orange `#e1811f`. Token names are historical — trust the comments, not the names.
- **`.page-light`** (globals.css) flips the tokens inside a subtree: white background, warm-black text, accents unchanged. Applied to all non-lyric pages AND `SlideShell`, so the deck slides are white while lyric/performance slides stay dark.
- **`AmbientBackground`** (`src/components/AmbientBackground.tsx`, v4 "halftime field") is the moving background system: a canvas dot-grid field where a randomly-pathed luminance crest sweeps across (one brand color per pass), spark dots twinkle, and a projector-falloff vignette anchors the edges. Design constraints agreed with the owner: **no AI-looking gradient blobs, no text, low contrast, nothing repeats** — the only gradient is the physical vignette. Canvas + single rAF, pauses when the tab hides, honors `prefers-reduced-motion` with a static frame.

## Show-day runbook (condensed)

1. Stage PC: open `/stage`, click ARM, press `F` for fullscreen.
2. Operator PC: open `/controller` (+ `/preview` on a second screen if wanted).
3. Phones: QR/link to `/audience`; camera phones to `/camera`; keep `/camera-ops` open to watch feeds.
4. Lyric operator: `/lyrics` on a tablet/phone — drives the 4 song performances live.
5. Audio: controller mixer commands route to the stage machine via the hub (`src/audio/engine.ts` executes there).
6. If a phone feed or reaction stalls: the transport auto-falls back from WS to HTTP polling — usually a school-network hiccup, wait a beat before rebooting anything.

## Tech stack

Next.js 16 (Turbopack) · React 19 · Tailwind CSS 4 · motion/react (framer-motion) · zustand (show store: `src/store/show.ts`) · ws (realtime hub) · am-lyrics (WebGL lyric engine) · qrcode.react. TypeScript strict throughout.

## Repository state at handoff

- Git repo with full history (remote: github.com/IRSPlays/SWAG-Day-FCS).
- Recent work: full 5-color palette swap, white backgrounds for all non-lyric pages + deck slides, ambient background system v3, project relocated out of OneDrive.
- Known small debt: `npm ls` reports an empty tree on this machine (npm 11 + global `omit=dev` quirk) — harmless; builds are the source of truth.
