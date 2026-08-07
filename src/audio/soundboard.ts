/* SFX pad configuration — the mixer's hotkeys. */

export interface Pad {
  id: string;
  label: string;
  key: string;
  skin: string;
}

export const PADS: Pad[] = [
  { id: "whistle", label: "WHISTLE", key: "1", skin: "border-mag text-mag" },
  { id: "airhorn", label: "AIRHORN", key: "2", skin: "border-volt text-volt" },
  { id: "applause", label: "APPLAUSE", key: "3", skin: "border-vio text-vio" },
  { id: "cheer", label: "CHEER", key: "4", skin: "border-mag text-mag" },
  { id: "roll", label: "DRUM ROLL", key: "5", skin: "border-volt text-volt" },
  { id: "sting", label: "STING", key: "6", skin: "border-vio text-vio" },
];
