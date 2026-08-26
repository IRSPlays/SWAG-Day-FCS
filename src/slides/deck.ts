/* Deck manifest — the ONLY ordering config.
   Each slide is its own file under ./slides; this list is the running order.
   Mirrors SWAG Day Concert Flow.docx (0940–1030) + Official Emcee Script. */

import type { SlideModule } from "./types";

/* 0940 · Grand Opening — emcees open, theme hype */
import * as s01 from "./slides/01-opening-sting";
import * as s02 from "./slides/02-emcee-welcome";

/* 0945 · The Walkway: Sports Edition — runway of champions */
import * as s03 from "./slides/03-walkway";

/* 0955 · Talent Block A — four performances */
import * as s04 from "./slides/04-talent-block-a";
import * as s05 from "./slides/05-perf-pulang";
import * as s06 from "./slides/06-perf-ditto";
import * as s07 from "./slides/07-perf-everlong";
import * as s08 from "./slides/08-perf-flashlight";

/* 1005 · The SWAG Tournament — three games, cumulative points */
import * as s09 from "./slides/09-tournament-intro";
import * as s10 from "./slides/10-game-inflatable-relay";
import * as s11 from "./slides/11-game-ball-balance";
import * as s12 from "./slides/12-game-shuttlecock-shuffle";
import * as s13 from "./slides/13-tournament-podium";

/* 1020 · Honor & Recognition — Teacher Awards */
import * as s14 from "./slides/14-teacher-awards";

/* 1022 · Talent Block B — four more performances */
import * as s15 from "./slides/15-perf-best-part";
import * as s16 from "./slides/16-perf-the-nights";
import * as s17 from "./slides/17-perf-still-into-you";
import * as s18 from "./slides/18-perf-untuk-dia";

/* 1025 · Grand Finale — fake ending glitch → PSG dance */
import * as s19 from "./slides/19-fake-ending";
import * as s20 from "./slides/20-psg-dance";

/* Closing — tribute + cinematic credits roll */
import * as s21 from "./slides/21-coaches-tribute";
import * as s22 from "./slides/22-end-credits";

export const deck: SlideModule[] = [
  s01,
  s02,
  s03,
  s04,
  s05,
  s06,
  s07,
  s08,
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
  s21,
  s22,
];

export const eventTitle = "TEACHERS' DAY '26 — SUIT UP! SHOW UP! SPORT IT UP!";
