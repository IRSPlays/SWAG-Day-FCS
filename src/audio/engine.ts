"use client";

/* AudioEngine — runs ON THE STAGE MACHINE (the one patched into the PA).
   The controller sends AudioCmd events; this executes them on real buses:

   bedA ─┐
         ├→ musicBus → duck → master → speakers
   bedB ─┘
   sfx ────→ sfxBus ─────────→ master
*/

import { getCtx, startBedA, startBedB, SFX_PLAYERS, type BedHandle } from "./synth";
import type { AudioCmd } from "@/realtime/types";

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private duckNode: GainNode | null = null;
  private bedA: GainNode | null = null;
  private bedB: GainNode | null = null;
  private bedHandle: BedHandle | null = null;
  private activeBed: "A" | "B" | null = null;
  private levels = { master: 0.9, music: 0.8, sfx: 0.9 };
  private duckOn = true;
  armed = false;

  /** must be called from a user gesture on the stage machine */
  arm() {
    if (this.armed) return;
    const c = getCtx();
    void c.resume();
    this.ctx = c;
    this.master = c.createGain();
    this.master.gain.value = this.levels.master;
    this.master.connect(c.destination);
    this.duckNode = c.createGain();
    this.duckNode.gain.value = 1;
    this.musicBus = c.createGain();
    this.musicBus.gain.value = this.levels.music;
    this.musicBus.connect(this.duckNode);
    this.duckNode.connect(this.master);
    this.sfxBus = c.createGain();
    this.sfxBus.gain.value = this.levels.sfx;
    this.sfxBus.connect(this.master);
    this.bedA = c.createGain();
    this.bedA.gain.value = 0;
    this.bedA.connect(this.musicBus);
    this.bedB = c.createGain();
    this.bedB.gain.value = 0;
    this.bedB.connect(this.musicBus);
    this.armed = true;
  }

  exec(cmd: AudioCmd) {
    if (!this.armed || !this.ctx) return;
    const c = this.ctx;
    const now = c.currentTime;
    switch (cmd.kind) {
      case "gain":
        this.levels[cmd.bus] = cmd.value;
        if (cmd.bus === "master") this.master?.gain.setTargetAtTime(cmd.value, now, 0.05);
        if (cmd.bus === "music") this.musicBus?.gain.setTargetAtTime(cmd.value, now, 0.05);
        if (cmd.bus === "sfx") this.sfxBus?.gain.setTargetAtTime(cmd.value, now, 0.05);
        break;
      case "duck":
        this.duckOn = cmd.on;
        break;
      case "fade-seconds":
        break;
      case "bed-start":
        this.startBed(cmd.bed);
        break;
      case "bed-stop":
        this.stopBed(0.4);
        break;
      case "crossfade":
        this.startBed(cmd.to);
        break;
      case "sfx": {
        const fn = SFX_PLAYERS[cmd.id];
        if (fn && this.sfxBus) {
          if (this.duckOn && this.duckNode) {
            this.duckNode.gain.cancelScheduledValues(now);
            this.duckNode.gain.setTargetAtTime(0.3, now, 0.05);
            this.duckNode.gain.setTargetAtTime(1, now + 1.1, 0.4);
          }
          fn(c, this.sfxBus);
        }
        break;
      }
    }
  }

  private startBed(bed: "A" | "B") {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const target = bed === "A" ? this.bedA : this.bedB;
    const other = bed === "A" ? this.bedB : this.bedA;
    if (this.activeBed !== bed) {
      this.bedHandle?.stop();
      this.bedHandle = bed === "A" ? startBedA(target!) : startBedB(target!);
      this.activeBed = bed;
    }
    target?.gain.cancelScheduledValues(now);
    target?.gain.setTargetAtTime(1, now, 0.6);
    other?.gain.cancelScheduledValues(now);
    other?.gain.setTargetAtTime(0, now, 0.6);
  }

  private stopBed(seconds: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.bedA?.gain.setTargetAtTime(0, now, seconds / 3);
    this.bedB?.gain.setTargetAtTime(0, now, seconds / 3);
    const h = this.bedHandle;
    setTimeout(() => h?.stop(), seconds * 1000 + 200);
    this.bedHandle = null;
    this.activeBed = null;
  }
}

export const audioEngine = new AudioEngine();
