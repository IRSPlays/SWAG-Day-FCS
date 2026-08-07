/* Deck manifest — the ONLY ordering config.
   Each slide is its own file under ./slides; this list is the running order. */

import type { SlideModule } from "./types";
import * as s01 from "./slides/01-opening-sting";
import * as s02 from "./slides/02-welcome";
import * as s03 from "./slides/03-home-team";
import * as s04 from "./slides/04-the-games";
import * as s05 from "./slides/05-live-vote";
import * as s06 from "./slides/06-podium";
import * as s07 from "./slides/07-finale";

export const deck: SlideModule[] = [s01, s02, s03, s04, s05, s06, s07];

export const eventTitle = "TEACHERS' DAY '26 — SUIT UP! SHOW UP! SPORT IT UP!";
