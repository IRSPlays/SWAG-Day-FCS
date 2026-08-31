/* Deck manifest — the ONLY ordering config.
   Each slide is its own file under ./slides; this list is the running order.
   Mirrors the SWAG Day 2026 EMCEE Script (NJ + Razan) beat for beat.
   NOTE: some filenames keep legacy numbers — this list is the truth. */

import type { SlideModule } from "./types";

/* Opening — emcees open, theme hype, SWAG cards credit */
import * as s01 from "./slides/01-opening-sting";
import * as s02 from "./slides/02-emcee-welcome";

/* The Walkway: Sports Edition — coaches' runway (music: "Count on Me") */
import * as s03 from "./slides/03-walkway";

/* Address & Awards — Mr Kelly Tan, then CTA + National honours (→ reveals) */
import * as s04 from "./slides/04-principal-address";
import * as s05 from "./slides/14-teacher-awards"; /* Caring Teacher Awards roll call */
import * as s06 from "./slides/06-awards-national";

/* Performances I — dedications filler, band, dance, Kylie, PSG, duet */
import * as s07 from "./slides/07-dedications-filler";
import * as s08 from "./slides/08-perf-lunar6tactics";
import * as s08b from "./slides/08b-dedications-2"; /* second filler: band clears up */
import * as s09 from "./slides/06-perf-ditto"; /* Raien · dance */
import * as s10 from "./slides/08-perf-flashlight"; /* Kylie */
import * as s11 from "./slides/20-psg-dance";
import * as s12 from "./slides/18-perf-untuk-dia"; /* Airis & Serena duet */

/* The Game — Guess Whose Desk! (round slide is re-edited live from /editor) */
import * as s13 from "./slides/13-game-desk-intro";
import * as s14 from "./slides/14-game-desk-round";

/* Performances II & close */
import * as s15 from "./slides/15-perf-rayyan-group";
import * as s16 from "./slides/16-perf-xiang-rui";
import * as s17 from "./slides/17-perf-final-band";
import * as s18 from "./slides/18-cheer-countdown";
import * as s19 from "./slides/21-coaches-tribute";
import * as s20 from "./slides/22-end-credits";

export const deck: SlideModule[] = [
  s01,
  s02,
  s03,
  s04,
  s05,
  s06,
  s07,
  s08,
  s08b,
  s09,
  s10,
  s11,
  s12,
  s13,
  s14,
  s15,
  s16,
  s17,
  s18,
  s19,
  s20,
];

export const eventTitle = "TEACHERS' DAY '26 — SUIT UP! SHOW UP! SPORT IT UP!";
