import { describe, it, expect } from "vitest";
import { formatRemaining, makeSeamlessNoise, NOISE_RMS, parseMixerPrefs } from "./ambient-dsp";

/** Deterministic PRNG so the noise assertions are stable. */
function seeded(seed = 42) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const rms = (d: Float32Array) => Math.sqrt(d.reduce((a, v) => a + v * v, 0) / d.length);

describe("makeSeamlessNoise", () => {
  it.each(["white", "pink", "brown"] as const)("normalises %s noise to the shared loudness", (color) => {
    const data = makeSeamlessNoise(color, 44100, 2048, seeded());
    expect(data).toHaveLength(44100);
    expect(rms(data)).toBeCloseTo(NOISE_RMS, 5);
  });

  it("joins the loop seam as smoothly as any neighbouring samples in brown noise", () => {
    const data = makeSeamlessNoise("brown", 44100, 2048, seeded(7));
    let maxStep = 0;
    for (let i = 1; i < data.length; i++) maxStep = Math.max(maxStep, Math.abs(data[i] - data[i - 1]));
    const seamStep = Math.abs(data[0] - data[data.length - 1]);
    expect(seamStep).toBeLessThanOrEqual(maxStep);
  });

  it("stays finite with no NaNs", () => {
    const data = makeSeamlessNoise("pink", 8000, 512, seeded(3));
    expect(data.every((v) => Number.isFinite(v))).toBe(true);
  });
});

describe("formatRemaining", () => {
  it("formats minutes and hours", () => {
    expect(formatRemaining(25 * 60 * 1000)).toBe("25:00");
    expect(formatRemaining(61_500)).toBe("01:02");
    expect(formatRemaining(3_725_000)).toBe("1:02:05");
  });

  it("never goes negative", () => {
    expect(formatRemaining(-5000)).toBe("00:00");
  });
});

describe("parseMixerPrefs", () => {
  const ids = ["rain", "ocean"] as const;
  const defaults = { volume: 0.5, levels: {}, lastMix: [] as ("rain" | "ocean")[] };

  it("falls back to defaults for missing or corrupt data", () => {
    expect(parseMixerPrefs(null, ids, defaults)).toBe(defaults);
    expect(parseMixerPrefs("{not json", ids, defaults)).toBe(defaults);
  });

  it("keeps valid values, clamps levels and drops unknown soundscapes", () => {
    const raw = JSON.stringify({ volume: 1.7, levels: { rain: 0.3, ocean: -1, lava: 1 }, lastMix: ["rain", "lava"] });
    expect(parseMixerPrefs(raw, ids, defaults)).toEqual({
      volume: 1,
      levels: { rain: 0.3, ocean: 0 },
      lastMix: ["rain"],
    });
  });
});
