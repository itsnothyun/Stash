/**
 * Ambient Focus Soundscapes Engine
 * Pure procedural Web Audio synthesis — 100% offline, zero external asset dependencies.
 * Soundscapes are layers in a mixer: several can play at once, each with its own level.
 */

import { makeSeamlessNoise, NoiseColor, parseMixerPrefs, MixerPrefs } from "./ambient-dsp";

export type SoundscapeType =
  | "rain"
  | "brownnoise"
  | "pinknoise"
  | "whitenoise"
  | "campfire"
  | "ocean"
  | "forest"
  | "cafe"
  | "alpha";

export interface SoundscapeDef {
  id: SoundscapeType;
  name: string;
  tagline: string;
  icon: string; // Emoji
}

export const SOUNDSCAPES_LIST: SoundscapeDef[] = [
  { id: "rain", name: "Rain", tagline: "Steady rainfall with real droplets", icon: "🌧️" },
  { id: "brownnoise", name: "Brown Noise", tagline: "Deep, warm rumble for intense focus", icon: "☕" },
  { id: "pinknoise", name: "Pink Noise", tagline: "Balanced, natural-sounding hush", icon: "🌸" },
  { id: "whitenoise", name: "White Noise", tagline: "Crisp mask for noisy rooms", icon: "📻" },
  { id: "campfire", name: "Campfire", tagline: "Warm hearth with crackles and pops", icon: "🔥" },
  { id: "ocean", name: "Ocean Waves", tagline: "Slow rolling shoreline swells", icon: "🌊" },
  { id: "forest", name: "Forest", tagline: "Wind in the trees and distant birds", icon: "🍃" },
  { id: "cafe", name: "Café", tagline: "Low murmur with the odd cup clink", icon: "🫖" },
  { id: "alpha", name: "Focus Beats", tagline: "10 Hz binaural tone (headphones)", icon: "🎧" },
];

export interface SoundscapePreset {
  id: string;
  name: string;
  layers: Partial<Record<SoundscapeType, number>>;
}

export const SOUNDSCAPE_PRESETS: SoundscapePreset[] = [
  { id: "deep-focus", name: "Deep Focus", layers: { brownnoise: 0.7, rain: 0.35 } },
  { id: "cozy", name: "Cozy Cabin", layers: { campfire: 0.75, rain: 0.45 } },
  { id: "nature", name: "Nature Walk", layers: { forest: 0.7, ocean: 0.4 } },
  { id: "coffee", name: "Coffee Shop", layers: { cafe: 0.75, rain: 0.25 } },
  { id: "flow", name: "Flow State", layers: { alpha: 0.5, pinknoise: 0.45 } },
];

const ALL_IDS = SOUNDSCAPES_LIST.map((s) => s.id);
const PREFS_KEY = "stash_focus_audio_v1";
const DEFAULT_LEVEL = 0.7;
const LAYER_FADE_S = 0.6;
const TIMER_FADE_S = 8;
/** Random events are scheduled this far ahead, so throttled background timers never leave gaps. */
const SCHEDULE_AHEAD_S = 1.5;
const SCHEDULER_INTERVAL_MS = 250;

export interface MixerSnapshot {
  active: SoundscapeType[];
  levels: Record<SoundscapeType, number>;
  volume: number;
  isPlaying: boolean;
  lastMix: SoundscapeType[];
  timerEndsAt: number | null;
  timerMinutes: number | null;
}

interface Layer {
  gain: GainNode;
  nodes: AudioNode[];
  sources: AudioScheduledSourceNode[];
  intervals: ReturnType<typeof setInterval>[];
}

type Listener = (snapshot: MixerSnapshot) => void;

class AmbientMixer {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private bus: GainNode | null = null;
  private layers = new Map<SoundscapeType, Layer>();
  private noiseCache = new Map<NoiseColor, AudioBuffer>();
  private listeners = new Set<Listener>();

  private volume: number;
  private levels: Record<SoundscapeType, number>;
  private lastMix: SoundscapeType[];

  private timerEndsAt: number | null = null;
  private timerMinutes: number | null = null;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private fadeOutId: ReturnType<typeof setTimeout> | null = null;

  private snapshot: MixerSnapshot;

  constructor() {
    const prefs = this.loadPrefs();
    this.volume = prefs.volume;
    this.levels = Object.fromEntries(
      ALL_IDS.map((id) => [id, prefs.levels[id] ?? DEFAULT_LEVEL])
    ) as Record<SoundscapeType, number>;
    this.lastMix = prefs.lastMix;
    this.snapshot = this.buildSnapshot();
  }

  // ------------------------------------------------------------------ state

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Stable between changes, so it works with React's useSyncExternalStore. */
  getSnapshot = (): MixerSnapshot => this.snapshot;

  private buildSnapshot(): MixerSnapshot {
    const active = ALL_IDS.filter((id) => this.layers.has(id));
    return {
      active,
      levels: { ...this.levels },
      volume: this.volume,
      isPlaying: active.length > 0,
      lastMix: [...this.lastMix],
      timerEndsAt: this.timerEndsAt,
      timerMinutes: this.timerMinutes,
    };
  }

  private emit() {
    this.snapshot = this.buildSnapshot();
    for (const listener of this.listeners) listener(this.snapshot);
  }

  private loadPrefs(): MixerPrefs<SoundscapeType> {
    const defaults: MixerPrefs<SoundscapeType> = { volume: 0.5, levels: {}, lastMix: ["rain"] };
    try {
      return parseMixerPrefs(localStorage.getItem(PREFS_KEY), ALL_IDS, defaults);
    } catch {
      return defaults;
    }
  }

  private savePrefs() {
    try {
      localStorage.setItem(
        PREFS_KEY,
        JSON.stringify({ volume: this.volume, levels: this.levels, lastMix: this.lastMix })
      );
    } catch {
      // Storage can be unavailable; preferences are a convenience.
    }
  }

  // --------------------------------------------------------------- controls

  isActive(type: SoundscapeType): boolean {
    return this.layers.has(type);
  }

  toggle(type: SoundscapeType) {
    if (this.layers.has(type)) this.removeLayer(type);
    else this.addLayer(type);
  }

  /** Replaces whatever is playing with a preset mix. */
  playPreset(preset: SoundscapePreset) {
    const wanted = Object.keys(preset.layers) as SoundscapeType[];
    for (const id of wanted) this.levels[id] = preset.layers[id] ?? DEFAULT_LEVEL;
    for (const id of [...this.layers.keys()]) {
      if (!wanted.includes(id)) this.removeLayer(id, false);
    }
    for (const id of wanted) {
      const layer = this.layers.get(id);
      if (layer) this.rampLayer(layer, this.levels[id]);
      else this.addLayer(id, false);
    }
    this.rememberMix();
  }

  /** Resumes the last mix you had playing. */
  resume() {
    const mix = this.lastMix.length > 0 ? this.lastMix : (["rain"] as SoundscapeType[]);
    for (const id of mix) if (!this.layers.has(id)) this.addLayer(id, false);
    this.rememberMix();
  }

  stopAll() {
    for (const id of [...this.layers.keys()]) this.removeLayer(id, false);
    this.clearTimer();
    this.emit();
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
    this.savePrefs();
    this.emit();
  }

  setLevel(type: SoundscapeType, level: number) {
    this.levels[type] = Math.max(0, Math.min(1, level));
    const layer = this.layers.get(type);
    if (layer) this.rampLayer(layer, this.levels[type], 0.05);
    this.savePrefs();
    this.emit();
  }

  /** Starts, changes or clears the sleep timer without interrupting playback. */
  setTimer(minutes: number | null) {
    this.clearTimer();
    if (minutes && minutes > 0) {
      this.timerMinutes = minutes;
      this.timerEndsAt = Date.now() + minutes * 60_000;
      const fadeStartMs = Math.max(0, minutes * 60_000 - TIMER_FADE_S * 1000);
      this.fadeOutId = setTimeout(() => {
        if (this.bus && this.ctx) {
          this.bus.gain.setTargetAtTime(0, this.ctx.currentTime, TIMER_FADE_S / 4);
        }
      }, fadeStartMs);
      this.timerId = setTimeout(() => {
        this.timerId = null;
        // The bus is already silent; leave it there while the layers wind down.
        this.clearTimer(false);
        for (const id of [...this.layers.keys()]) this.removeLayer(id, false);
        this.emit();
      }, minutes * 60_000);
    }
    this.emit();
  }

  private clearTimer(restoreBus = true) {
    if (this.timerId) clearTimeout(this.timerId);
    if (this.fadeOutId) clearTimeout(this.fadeOutId);
    this.timerId = null;
    this.fadeOutId = null;
    this.timerEndsAt = null;
    this.timerMinutes = null;
    // Undo a timer fade that was already under way.
    if (restoreBus && this.bus && this.ctx) {
      this.bus.gain.cancelScheduledValues(this.ctx.currentTime);
      this.bus.gain.setTargetAtTime(1, this.ctx.currentTime, 0.1);
    }
  }

  private rememberMix() {
    const active = ALL_IDS.filter((id) => this.layers.has(id));
    if (active.length > 0) this.lastMix = active;
    this.savePrefs();
    this.emit();
  }

  // ------------------------------------------------------------ audio graph

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      // The bus carries the sleep-timer fade, independent of the volume slider.
      this.bus = this.ctx.createGain();
      this.bus.gain.value = 1;
      // A gentle compressor keeps stacked layers from clipping.
      const limiter = this.ctx.createDynamicsCompressor();
      limiter.threshold.value = -10;
      limiter.knee.value = 8;
      limiter.ratio.value = 6;
      this.bus.connect(this.master);
      this.master.connect(limiter);
      limiter.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private addLayer(type: SoundscapeType, notify = true) {
    const ctx = this.ensureContext();
    if (!ctx || !this.bus || this.layers.has(type)) return;

    // Starting fresh after a sleep-timer fade: bring the bus back up first.
    if (this.layers.size === 0 && !this.timerId) {
      this.bus.gain.cancelScheduledValues(ctx.currentTime);
      this.bus.gain.setValueAtTime(1, ctx.currentTime);
    }

    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(this.bus);
    const layer: Layer = { gain, nodes: [gain], sources: [], intervals: [] };
    this.layers.set(type, layer);

    try {
      BUILDERS[type](ctx, layer, this);
    } catch {
      // A failed graph should never take the rest of the mix down with it.
    }
    this.rampLayer(layer, this.levels[type]);
    if (notify) this.rememberMix();
  }

  private removeLayer(type: SoundscapeType, notify = true) {
    const layer = this.layers.get(type);
    if (!layer || !this.ctx) return;
    this.layers.delete(type);

    // Each layer cleans up only its own nodes, so re-adding the same soundscape
    // during the fade can never be cut short.
    for (const id of layer.intervals) clearInterval(id);
    layer.intervals = [];
    this.rampLayer(layer, 0);
    const stopAt = this.ctx.currentTime + LAYER_FADE_S * 1.5;
    for (const source of layer.sources) {
      try {
        source.stop(stopAt);
      } catch {
        // Already stopped.
      }
    }
    setTimeout(() => {
      for (const node of layer.nodes) {
        try {
          node.disconnect();
        } catch {
          // Already disconnected.
        }
      }
    }, LAYER_FADE_S * 1500 + 100);

    if (notify) this.rememberMix();
  }

  private rampLayer(layer: Layer, target: number, seconds = LAYER_FADE_S) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    layer.gain.gain.cancelScheduledValues(now);
    layer.gain.gain.setValueAtTime(layer.gain.gain.value, now);
    layer.gain.gain.linearRampToValueAtTime(target, now + seconds);
  }

  /** Shared, cached 8-second seamless noise loops. */
  noiseBuffer(ctx: AudioContext, color: NoiseColor): AudioBuffer {
    let buffer = this.noiseCache.get(color);
    if (!buffer) {
      const length = ctx.sampleRate * 8;
      buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      buffer.getChannelData(0).set(makeSeamlessNoise(color, length));
      this.noiseCache.set(color, buffer);
    }
    return buffer;
  }
}

// --------------------------------------------------------------- builders

type Builder = (ctx: AudioContext, layer: Layer, mixer: AmbientMixer) => void;

/** A looping noise source, started at a random offset so stacked layers don't phase. */
function noiseSource(ctx: AudioContext, layer: Layer, mixer: AmbientMixer, color: NoiseColor) {
  const source = ctx.createBufferSource();
  source.buffer = mixer.noiseBuffer(ctx, color);
  source.loop = true;
  source.start(0, Math.random() * 8);
  layer.sources.push(source);
  layer.nodes.push(source);
  return source;
}

function filter(ctx: AudioContext, layer: Layer, type: BiquadFilterType, frequency: number, q = 0.7) {
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = frequency;
  f.Q.value = q;
  layer.nodes.push(f);
  return f;
}

function gainNode(ctx: AudioContext, layer: Layer, value: number) {
  const g = ctx.createGain();
  g.gain.value = value;
  layer.nodes.push(g);
  return g;
}

/** A slow sine LFO wobbling `param` by ±depth. */
function lfo(ctx: AudioContext, layer: Layer, param: AudioParam, rate: number, depth: number) {
  const osc = ctx.createOscillator();
  osc.frequency.value = rate;
  const amount = gainNode(ctx, layer, depth);
  osc.connect(amount);
  amount.connect(param);
  osc.start();
  layer.sources.push(osc);
  layer.nodes.push(osc);
}

/**
 * Schedules short random events (drops, crackles, chirps) ahead of time on the
 * audio clock. `nextGap` returns seconds until the following event.
 */
function scheduleEvents(
  ctx: AudioContext,
  layer: Layer,
  nextGap: () => number,
  play: (when: number) => void
) {
  let next = ctx.currentTime + nextGap();
  const tick = () => {
    const horizon = ctx.currentTime + SCHEDULE_AHEAD_S;
    // After a long stall, skip forward rather than firing a burst of stale events.
    if (next < ctx.currentTime) next = ctx.currentTime + nextGap();
    while (next < horizon) {
      play(next);
      next += nextGap();
    }
  };
  tick();
  layer.intervals.push(setInterval(tick, SCHEDULER_INTERVAL_MS));
}

/** A one-shot filtered noise burst with a fast attack and exponential decay. */
function burst(
  ctx: AudioContext,
  mixer: AmbientMixer,
  destination: AudioNode,
  when: number,
  opts: { color: NoiseColor; type: BiquadFilterType; freq: number; q: number; peak: number; decay: number }
) {
  const src = ctx.createBufferSource();
  src.buffer = mixer.noiseBuffer(ctx, opts.color);
  const f = ctx.createBiquadFilter();
  f.type = opts.type;
  f.frequency.value = opts.freq;
  f.Q.value = opts.q;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, when);
  env.gain.linearRampToValueAtTime(opts.peak, when + 0.002);
  env.gain.exponentialRampToValueAtTime(0.0001, when + opts.decay);
  src.connect(f);
  f.connect(env);
  env.connect(destination);
  src.start(when, Math.random() * 7);
  src.stop(when + opts.decay + 0.05);
  src.onended = () => {
    src.disconnect();
    f.disconnect();
    env.disconnect();
  };
}

/** A short pitched tone sweeping from `from` to `to` Hz. */
function chirp(ctx: AudioContext, destination: AudioNode, when: number, from: number, to: number, dur: number, peak: number) {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(from, when);
  osc.frequency.exponentialRampToValueAtTime(to, when + dur);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, when);
  env.gain.linearRampToValueAtTime(peak, when + dur * 0.2);
  env.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(env);
  env.connect(destination);
  osc.start(when);
  osc.stop(when + dur + 0.05);
  osc.onended = () => {
    osc.disconnect();
    env.disconnect();
  };
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

const BUILDERS: Record<SoundscapeType, Builder> = {
  whitenoise(ctx, layer, mixer) {
    const soft = filter(ctx, layer, "lowpass", 9000);
    const level = gainNode(ctx, layer, 1.6);
    noiseSource(ctx, layer, mixer, "white").connect(soft);
    soft.connect(level);
    level.connect(layer.gain);
  },

  pinknoise(ctx, layer, mixer) {
    const level = gainNode(ctx, layer, 1.3);
    noiseSource(ctx, layer, mixer, "pink").connect(level);
    level.connect(layer.gain);
  },

  brownnoise(ctx, layer, mixer) {
    const level = gainNode(ctx, layer, 1.5);
    const lp = filter(ctx, layer, "lowpass", 500);
    noiseSource(ctx, layer, mixer, "brown").connect(lp);
    lp.connect(level);
    level.connect(layer.gain);
  },

  rain(ctx, layer, mixer) {
    // Bed: band-limited pink noise with a slow intensity drift.
    const bed = filter(ctx, layer, "lowpass", 2400);
    const hp = filter(ctx, layer, "highpass", 250);
    const bedGain = gainNode(ctx, layer, 1.8);
    noiseSource(ctx, layer, mixer, "pink").connect(hp);
    hp.connect(bed);
    bed.connect(bedGain);
    bedGain.connect(layer.gain);
    lfo(ctx, layer, bedGain.gain, 0.05, 0.25);

    // Individual droplets hitting the window.
    const drops = gainNode(ctx, layer, 1);
    drops.connect(layer.gain);
    scheduleEvents(ctx, layer, () => rand(0.02, 0.12), (when) =>
      burst(ctx, mixer, drops, when, {
        color: "white",
        type: "bandpass",
        freq: rand(1800, 6000),
        q: rand(3, 8),
        peak: rand(0.15, 0.6),
        decay: rand(0.015, 0.05),
      })
    );
  },

  campfire(ctx, layer, mixer) {
    // Low roar of the flames.
    const roar = filter(ctx, layer, "lowpass", 300);
    const roarGain = gainNode(ctx, layer, 1.2);
    noiseSource(ctx, layer, mixer, "brown").connect(roar);
    roar.connect(roarGain);
    roarGain.connect(layer.gain);
    lfo(ctx, layer, roarGain.gain, 0.3, 0.4);

    const crackles = gainNode(ctx, layer, 1);
    crackles.connect(layer.gain);
    // Small crackles in quick clusters.
    scheduleEvents(ctx, layer, () => (Math.random() < 0.3 ? rand(0.01, 0.06) : rand(0.08, 0.5)), (when) =>
      burst(ctx, mixer, crackles, when, {
        color: "white",
        type: "highpass",
        freq: rand(1500, 4000),
        q: 0.8,
        peak: rand(0.1, 0.45),
        decay: rand(0.005, 0.02),
      })
    );
    // Occasional louder pops from the logs.
    scheduleEvents(ctx, layer, () => rand(1.5, 6), (when) =>
      burst(ctx, mixer, crackles, when, {
        color: "white",
        type: "bandpass",
        freq: rand(600, 1600),
        q: 2,
        peak: rand(0.6, 1),
        decay: rand(0.04, 0.09),
      })
    );
  },

  ocean(ctx, layer, mixer) {
    const lp = filter(ctx, layer, "lowpass", 600);
    const swell = gainNode(ctx, layer, 1.1);
    noiseSource(ctx, layer, mixer, "pink").connect(lp);
    lp.connect(swell);
    swell.connect(layer.gain);
    // Waves: loudness and brightness rise and fall together, ~9 s per wave.
    lfo(ctx, layer, swell.gain, 0.11, 0.75);
    lfo(ctx, layer, lp.frequency, 0.11, 380);
  },

  forest(ctx, layer, mixer) {
    const bp = filter(ctx, layer, "bandpass", 700, 0.9);
    const wind = gainNode(ctx, layer, 2.6);
    noiseSource(ctx, layer, mixer, "pink").connect(bp);
    bp.connect(wind);
    wind.connect(layer.gain);
    lfo(ctx, layer, wind.gain, 0.07, 0.5);
    lfo(ctx, layer, bp.frequency, 0.05, 250);

    // Distant birds: little runs of two to four chirps.
    const birds = gainNode(ctx, layer, 0.08);
    birds.connect(layer.gain);
    scheduleEvents(ctx, layer, () => rand(2.5, 9), (when) => {
      const base = rand(2400, 4200);
      const notes = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < notes; i++) {
        const t = when + i * rand(0.09, 0.16);
        chirp(ctx, birds, t, base * rand(0.95, 1.1), base * rand(1.15, 1.45), rand(0.06, 0.11), rand(0.5, 1));
      }
    });
  },

  cafe(ctx, layer, mixer) {
    // Room murmur: voice-band noise with a slow, uneven swell.
    const lp = filter(ctx, layer, "lowpass", 1100);
    const hp = filter(ctx, layer, "highpass", 180);
    const murmur = gainNode(ctx, layer, 1.6);
    noiseSource(ctx, layer, mixer, "brown").connect(hp);
    hp.connect(lp);
    lp.connect(murmur);
    murmur.connect(layer.gain);
    lfo(ctx, layer, murmur.gain, 0.23, 0.35);
    lfo(ctx, layer, lp.frequency, 0.37, 250);

    // Cups and spoons now and then.
    const clinks = gainNode(ctx, layer, 0.05);
    clinks.connect(layer.gain);
    scheduleEvents(ctx, layer, () => rand(3, 10), (when) => {
      const f = rand(2600, 4200);
      chirp(ctx, clinks, when, f, f * 0.98, rand(0.25, 0.45), 1);
      if (Math.random() < 0.4) chirp(ctx, clinks, when + rand(0.08, 0.2), f * 1.33, f * 1.3, 0.3, 0.6);
    });
  },

  alpha(ctx, layer) {
    // A 10 Hz difference between the ears; a soft tone without headphones.
    const merger = ctx.createChannelMerger(2);
    layer.nodes.push(merger);
    const level = gainNode(ctx, layer, 0.12);
    for (const [channel, freq] of [[0, 200], [1, 210]] as const) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(merger, 0, channel);
      osc.start();
      layer.sources.push(osc);
      layer.nodes.push(osc);
    }
    merger.connect(level);
    level.connect(layer.gain);
  },
};

export const ambientAudioEngine = new AmbientMixer();
