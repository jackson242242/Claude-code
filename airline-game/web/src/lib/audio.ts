// Procedural ambient audio engine — Web Audio API only, zero assets.
// "Airline lounge × modern strategy game" vibe.
// Browser autoplay policy: AudioContext only created on first user gesture.

const PREF_KEY = 'skyempire.audio';

// Cmaj7, Am9, Fmaj7, G6 — four chord tones each (Hz, A4=440).
const CHORD_PROGRESSIONS: readonly (readonly number[])[] = [
  [261.63, 329.63, 392.0, 493.88], // Cmaj7: C4 E4 G4 B4
  [220.0, 261.63, 329.63, 415.3],  // Am9:   A3 C4 E4 Ab4 (≈ G#4)
  [174.61, 220.0, 261.63, 349.23], // Fmaj7: F3 A3 C4 F4
  [196.0, 246.94, 293.66, 369.99], // G6:    G3 B3 D4 E4
];

const CHORD_INTERVAL_MS = 30_000; // 30 s per chord

interface AudioEngine {
  ctx: AudioContext;
  oscillators: OscillatorNode[];
  filter: BiquadFilterNode;
  lfo: OscillatorNode;
  master: GainNode;
  chordTimer: ReturnType<typeof setInterval> | null;
  chordIndex: number;
}

let engine: AudioEngine | null = null;

const readPref = (): boolean => {
  if (typeof window === 'undefined') return true;
  return (window.localStorage.getItem(PREF_KEY) ?? 'on') !== 'off';
};

const writePref = (on: boolean): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PREF_KEY, on ? 'on' : 'off');
};

const buildEngine = (): AudioEngine => {
  const ctx = new AudioContext();

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.06, ctx.currentTime);
  master.connect(ctx.destination);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, ctx.currentTime);
  filter.connect(master);

  // LFO modulating filter frequency (slow drift 0.07 Hz)
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(0.07, ctx.currentTime);
  const lfoGain = ctx.createGain();
  lfoGain.gain.setValueAtTime(200, ctx.currentTime); // ±200 Hz sweep
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();

  // Start on first chord (Cmaj7)
  const firstChord = CHORD_PROGRESSIONS[0];
  const oscillators: OscillatorNode[] = firstChord.map((freq) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    // Slight detune for richness
    osc.detune.setValueAtTime(Math.random() * 8 - 4, ctx.currentTime);
    osc.connect(filter);
    osc.start();
    return osc;
  });

  // Add a triangle osc for warmth
  const warmOsc = ctx.createOscillator();
  warmOsc.type = 'triangle';
  warmOsc.frequency.setValueAtTime(130.81, ctx.currentTime); // C3
  warmOsc.connect(filter);
  warmOsc.start();
  oscillators.push(warmOsc);

  let chordIndex = 0;

  const advanceChord = (): void => {
    if (!engine) return;
    chordIndex = (chordIndex + 1) % CHORD_PROGRESSIONS.length;
    const chord = CHORD_PROGRESSIONS[chordIndex];
    const now = engine.ctx.currentTime;
    // Update first N oscillators (skip the warm bass osc at end)
    chord.forEach((freq, i) => {
      if (engine && engine.oscillators[i]) {
        engine.oscillators[i].frequency.linearRampToValueAtTime(freq, now + 2.5);
      }
    });
    engine.chordIndex = chordIndex;
  };

  const chordTimer = setInterval(advanceChord, CHORD_INTERVAL_MS);

  return { ctx, oscillators, filter, lfo, master, chordTimer, chordIndex };
};

export const audio = {
  start(): void {
    if (typeof window === 'undefined') return;
    if (typeof AudioContext === 'undefined') return;
    if (engine) {
      // Idempotent: already created — just resume if pref is on.
      if (readPref() && engine.ctx.state === 'suspended') {
        void engine.ctx.resume();
      }
      return;
    }
    engine = buildEngine();
    if (!readPref()) {
      void engine.ctx.suspend();
    }
  },

  stop(): void {
    if (!engine) return;
    if (engine.chordTimer !== null) clearInterval(engine.chordTimer);
    engine.oscillators.forEach((osc) => {
      try { osc.stop(); } catch { /* already stopped */ }
      osc.disconnect();
    });
    engine.lfo.stop();
    engine.lfo.disconnect();
    engine.filter.disconnect();
    engine.master.disconnect();
    void engine.ctx.suspend();
    engine = null;
  },

  toggle(): void {
    if (typeof window === 'undefined') return;
    if (!engine) {
      // First call — create and immediately play.
      writePref(true);
      this.start();
      return;
    }
    const currentlyPlaying = engine.ctx.state === 'running';
    if (currentlyPlaying) {
      writePref(false);
      void engine.ctx.suspend();
    } else {
      writePref(true);
      void engine.ctx.resume();
    }
  },

  isPlaying(): boolean {
    if (typeof window === 'undefined') return false;
    return engine !== null && engine.ctx.state === 'running';
  },
};
