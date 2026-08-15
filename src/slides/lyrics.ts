/* Lyric cue contract for PERFORMANCE slides (band / vocal / dance).
    A performance slide = this cue list + song header. The engine
    (components/LyricTimeline) hunts cues by timestamp and applies
    the matching mograph treatment per style. Content stays HERE;
    motion lives in animations/lyrics. */

export type LyricStyle = "hook" | "verse" | "pre" | "chorus" | "bridge" | "outro";

export interface LyricCue {
  /** seconds from slide start */
  t: number;
  /** the line itself */
  text: string;
  style: LyricStyle;
  /** section label shown on the stage badge, e.g. "CHORUS" */
  label?: string;
  /** words painted in the accent colour (matched loosely, case-insensitive) */
  emph?: string[];
}

export interface SongHeader {
  /** e.g. "BAND PERFORMANCE" */
  kind: string;
  song: string;
  artist: string;
}