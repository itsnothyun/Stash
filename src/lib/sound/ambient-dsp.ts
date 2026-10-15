/** Pure helpers for the ambient mixer: noise synthesis, preference parsing and timer text. */

export type NoiseColor = "white" | "pink" | "brown";

/**
 * Fills a buffer with noise that loops without a click: `fade` extra samples are
 * generated and crossfaded into the start, so the last sample flows into the first.
 */
export function makeSeamlessNoise(
  color: NoiseColor,
  length: number,
  fade = Math.min(4096, Math.floor(length / 8)),
  random: () => number = Math.random
): Float32Array {
  const total = length + fade;
  const raw = new Float32Array(total);

  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  let last = 0;
  for (let i = 0; i < total; i++) {
    const white = random() * 2 - 1;
    if (color === "white") {
      raw[i] = white;
    } else if (color === "pink") {
      // Paul Kellet's refined pink noise filter
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      raw[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
    } else {
      // Leaky integrator keeps brown noise centred instead of drifting
      last = (last + 0.02 * white) / 1.02;
      raw[i] = last;
    }
  }

  const out = raw.slice(0, length);
  for (let i = 0; i < fade; i++) {
    const t = i / fade;
    // Equal-power crossfade keeps loudness steady through the seam
    out[i] = raw[i] * Math.sin((t * Math.PI) / 2) + raw[length + i] * Math.cos((t * Math.PI) / 2);
  }
  return normalizeRms(out, NOISE_RMS);
}

/** Every noise colour is scaled to the same loudness so layers mix predictably. */
export const NOISE_RMS = 0.1;

export function normalizeRms(data: Float32Array, target: number): Float32Array {
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
  const rms = Math.sqrt(sum / Math.max(1, data.length));
  if (rms === 0) return data;
  const scale = target / rms;
  for (let i = 0; i < data.length; i++) data[i] *= scale;
  return data;
}

/** "mm:ss" for under an hour, "h:mm:ss" above. */
export function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export interface MixerPrefs<T extends string> {
  volume: number;
  levels: Partial<Record<T, number>>;
  lastMix: T[];
}

const clamp01 = (n: unknown, fallback: number) =>
  typeof n === "number" && isFinite(n) ? Math.min(1, Math.max(0, n)) : fallback;

/** Reads stored preferences defensively; anything malformed falls back to defaults. */
export function parseMixerPrefs<T extends string>(
  raw: string | null,
  validIds: readonly T[],
  defaults: MixerPrefs<T>
): MixerPrefs<T> {
  if (!raw) return defaults;
  try {
    const data = JSON.parse(raw) as Partial<MixerPrefs<string>>;
    const valid = new Set<string>(validIds);
    const levels: Partial<Record<T, number>> = {};
    if (data.levels && typeof data.levels === "object") {
      for (const [id, level] of Object.entries(data.levels)) {
        if (valid.has(id)) levels[id as T] = clamp01(level, 0.7);
      }
    }
    const lastMix = Array.isArray(data.lastMix)
      ? (data.lastMix.filter((id) => typeof id === "string" && valid.has(id)) as T[])
      : defaults.lastMix;
    return { volume: clamp01(data.volume, defaults.volume), levels, lastMix };
  } catch {
    return defaults;
  }
}
