"use client";

/* Procedural sound design — ZERO binary assets.
   Every SFX and music bed is synthesized live with the Web Audio API,
   so the show works with no audio files shipped. */

let ctx: AudioContext | null = null;
let noiseBuf: AudioBuffer | null = null;

export function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function noise(c: AudioContext): AudioBuffer {
  if (noiseBuf) return noiseBuf;
  const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  noiseBuf = buf;
  return buf;
}

function env(c: AudioContext, t0: number, a: number, peak: number, dur: number): GainNode {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  return g;
}

/* ---------------- one-shots ---------------- */

export function playWhistle(c: AudioContext, out: AudioNode) {
  const t0 = c.currentTime;
  for (const burst of [0, 0.45]) {
    const o = c.createOscillator();
    o.type = "square";
    o.frequency.value = 2150;
    const trill = c.createOscillator();
    trill.frequency.value = 42;
    const trillG = c.createGain();
    trillG.gain.value = 0.45;
    const g = env(c, t0 + burst, 0.01, 0.5, burst ? 0.62 : 0.34);
    trill.connect(trillG).connect(g.gain);
    o.connect(g).connect(out);
    o.start(t0 + burst);
    o.stop(t0 + burst + 0.7);
    trill.start(t0 + burst);
    trill.stop(t0 + burst + 0.7);
  }
}

export function playAirhorn(c: AudioContext, out: AudioNode) {
  const t0 = c.currentTime;
  const g = env(c, t0, 0.04, 0.55, 1.1);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 2200;
  [233, 293, 349].forEach((f, i) => {
    const o = c.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(f, t0);
    o.frequency.linearRampToValueAtTime(f * 0.985, t0 + 1);
    o.detune.value = i * 6 - 6;
    o.connect(lp);
    o.start(t0);
    o.stop(t0 + 1.15);
  });
  lp.connect(g).connect(out);
}

export function playApplause(c: AudioContext, out: AudioNode) {
  const t0 = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noise(c);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1900;
  bp.Q.value = 0.6;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(0.5, t0 + 0.08);
  g.gain.setValueAtTime(0.5, t0 + 1.2);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.1);
  const lfo = c.createOscillator();
  lfo.frequency.value = 11;
  const lfoG = c.createGain();
  lfoG.gain.value = 0.22;
  lfo.connect(lfoG).connect(g.gain);
  src.connect(bp).connect(g).connect(out);
  src.start(t0);
  src.stop(t0 + 2.2);
  lfo.start(t0);
  lfo.stop(t0 + 2.2);
}

export function playCheer(c: AudioContext, out: AudioNode) {
  const t0 = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noise(c);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 0.9;
  bp.frequency.setValueAtTime(700, t0);
  bp.frequency.linearRampToValueAtTime(2400, t0 + 0.9);
  const g = env(c, t0, 0.15, 0.5, 1.8);
  src.connect(bp).connect(g).connect(out);
  src.start(t0);
  src.stop(t0 + 1.9);
  playApplause(c, out);
}

export function playRoll(c: AudioContext, out: AudioNode) {
  const t0 = c.currentTime;
  let t = t0;
  let gap = 0.11;
  for (let i = 0; i < 16; i++) {
    const src = c.createBufferSource();
    src.buffer = noise(c);
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 950;
    const g = env(c, t, 0.005, i === 15 ? 0.8 : 0.4, i === 15 ? 0.5 : 0.09);
    src.connect(bp).connect(g).connect(out);
    src.start(t);
    src.stop(t + 0.55);
    t += gap;
    gap *= 0.88;
  }
}

export function playSting(c: AudioContext, out: AudioNode) {
  const t0 = c.currentTime;
  [523, 659, 784, 1046].forEach((f) => {
    const o = c.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(f * 0.97, t0);
    o.frequency.linearRampToValueAtTime(f, t0 + 0.08);
    const g = env(c, t0, 0.015, 0.22, 0.85);
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 3200;
    o.connect(lp).connect(g).connect(out);
    o.start(t0);
    o.stop(t0 + 0.9);
  });
}

export const SFX_PLAYERS: Record<string, (c: AudioContext, out: AudioNode) => void> = {
  whistle: playWhistle,
  airhorn: playAirhorn,
  applause: playApplause,
  cheer: playCheer,
  roll: playRoll,
  sting: playSting,
};

/* ---------------- music beds (looping, lookahead-scheduled) ---------------- */

export interface BedHandle {
  stop: () => void;
}

function scheduler(bpm: number, stepFn: (step: number, t: number) => void): BedHandle {
  const c = getCtx();
  const spb = 60 / bpm / 4; // 16th note
  let step = 0;
  let next = c.currentTime + 0.06;
  const id = setInterval(() => {
    while (next < c.currentTime + 0.14) {
      stepFn(step, next);
      step = (step + 1) % 64;
      next += spb;
    }
  }, 30);
  return { stop: () => clearInterval(id) };
}

function kick(c: AudioContext, t: number, out: AudioNode, peak = 0.9) {
  const o = c.createOscillator();
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(44, t + 0.11);
  const g = env(c, t, 0.004, peak, 0.24);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.3);
}

function hat(c: AudioContext, t: number, out: AudioNode, peak = 0.12) {
  const src = c.createBufferSource();
  src.buffer = noise(c);
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 8000;
  const g = env(c, t, 0.002, peak, 0.05);
  src.connect(hp).connect(g).connect(out);
  src.start(t);
  src.stop(t + 0.08);
}

function bassNote(c: AudioContext, t: number, f: number, dur: number, out: AudioNode) {
  const o = c.createOscillator();
  o.type = "square";
  o.frequency.value = f;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 520;
  const g = env(c, t, 0.01, 0.3, dur);
  o.connect(lp).connect(g).connect(out);
  o.start(t);
  o.stop(t + dur + 0.05);
}

/** Bed A — 126bpm hype four-on-the-floor */
export function startBedA(out: AudioNode): BedHandle {
  const c = getCtx();
  const bassLine = [55, 0, 55, 0, 65.4, 0, 55, 0, 55, 0, 55, 0, 82.4, 0, 73.4, 0];
  return scheduler(126, (step, t) => {
    if (step % 4 === 0) kick(c, t, out);
    if (step % 8 === 4) hat(c, t, out, 0.16);
    if (step % 2 === 0) {
      const f = bassLine[(step / 2) % 16];
      if (f) bassNote(c, t, f, 0.22, out);
    }
    if (step === 8 || step === 24 || step === 40 || step === 56) hat(c, t, out, 0.2);
  });
}

/** Bed B — 92bpm warm pad groove */
export function startBedB(out: AudioNode): BedHandle {
  const c = getCtx();
  const chords = [
    [220, 261.6, 329.6],
    [174.6, 220, 261.6],
    [196, 246.9, 293.7],
    [164.8, 196, 246.9],
  ];
  return scheduler(92, (step, t) => {
    if (step === 0 || step === 32) kick(c, t, out, 0.6);
    if (step % 8 === 4) hat(c, t, out, 0.08);
    if (step % 16 === 0) {
      const chord = chords[(step / 16) % 4];
      chord.forEach((f) => {
        const o = c.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = f;
        o.detune.value = 5;
        const lp = c.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 850;
        const g = c.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.09, t + 0.4);
        g.gain.linearRampToValueAtTime(0.0001, t + 3.4);
        o.connect(lp).connect(g).connect(out);
        o.start(t);
        o.stop(t + 3.5);
      });
    }
  });
}
