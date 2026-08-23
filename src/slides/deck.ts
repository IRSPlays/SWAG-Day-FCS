/* Deck manifest — the ONLY ordering config.
   Each slide is its own file under ./slides; this list is the running order. */

import type { SlideModule } from "./types";

/* Act 1: Opening Sting & Sports Team Hype */
import * as s01 from "./slides/01-opening-sting";
import * as s02 from "./slides/02-are-you-ready";

/* Act 2: Musical Performance Block 1 */
import * as s03 from "./slides/03-perf-pulang";
import * as s04 from "./slides/04-perf-ditto";
import * as s05 from "./slides/05-perf-everlong";
import * as s06 from "./slides/06-perf-flashlight";

/* Act 3: Cohort Tournament Game Segment */
import * as s07 from "./slides/07-tournament-intro";
import * as s08 from "./slides/08-game-inflatable-relay";
import * as s09 from "./slides/09-game-ball-balance";
import * as s10 from "./slides/10-tournament-podium";

/* Act 4: Musical Performance Block 2 */
import * as s11 from "./slides/11-perf-song5";
import * as s12 from "./slides/12-perf-song6";
import * as s13 from "./slides/13-perf-song7";
import * as s14 from "./slides/14-perf-song8";

/* Act 5: Surprise PSG Dance */
import * as s15 from "./slides/15-fake-ending";
import * as s16 from "./slides/16-psg-dance";

/* Act 6 & 7: Coaches Tribute & Cinematic Movie End Credits */
import * as s17 from "./slides/17-coaches-tribute";
import * as s18 from "./slides/18-end-credits";

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
];

export const eventTitle = "TEACHERS' DAY '26 — SUIT UP! SHOW UP! SPORT IT UP!";
