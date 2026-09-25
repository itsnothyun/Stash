/**
 * Ambient Focus Soundscapes Engine
 * Pure procedural Web Audio synthesis — 100% offline, zero external asset dependencies.
 */

export type SoundscapeType =
  | "rain"
  | "whitenoise"
  | "pinknoise"
  | "brownnoise"
  | "campfire"
  | "ocean"
  | "forest";

export interface SoundscapeDef {
  id: SoundscapeType;
  name: string;
  tagline: string;
  icon: string; // Emoji
}

export const SOUNDSCAPES_LIST: SoundscapeDef[] = [
  { id: "rain", name: "Rain on Window", tagline: "Gentle falling raindrops with low rumble", icon: "🌧️" },
  { id: "brownnoise", name: "Deep Brown Noise", tagline: "Warm, deep frequency mask for intense focus", icon: "☕" },
  { id: "pinknoise", name: "Balanced Pink Noise", tagline: "Natural soothing acoustic focus spectrum", icon: "🌸" },
  { id: "whitenoise", name: "Clean White Noise", tagline: "Crisp background hum to block distractions", icon: "📻" },
  { id: "campfire", name: "Campfire Embers", tagline: "Crackling warm hearth with soft flame pops", icon: "🔥" },
  { id: "ocean", name: "Ocean Waves", tagline: "Rhythmic rolling shoreline tides", icon: "🌊" },
  { id: "forest", name: "Forest Breeze", tagline: "Soft wind rustling through dense trees", icon: "🍃" },
];

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentType: SoundscapeType | null = null;
  private isPlaying = false;
  private volume = 0.5;
  private activeNodes: { stop?: () => void; disconnect: () => void }[] = [];
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private timerMinutes: number | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentType(): SoundscapeType | null {
    return this.currentType;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getTimerMinutes(): number | null {
    return this.timerMinutes;
  }

  public stop() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.timerMinutes = null;

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
    }

    setTimeout(() => {
      for (const node of this.activeNodes) {
        try {
          if (node.stop) node.stop();
          node.disconnect();
        } catch {
          // ignore
        }
      }
      this.activeNodes = [];
      this.isPlaying = false;
      this.currentType = null;
    }, 120);
  }

  public play(type: SoundscapeType, minutesTimer?: number) {
    this.stop();
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.currentType = type;
    this.isPlaying = true;
    this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

    switch (type) {
      case "rain":
        this.startRain();
        break;
      case "brownnoise":
        this.startNoise("brown");
        break;
      case "pinknoise":
        this.startNoise("pink");
        break;
      case "whitenoise":
        this.startNoise("white");
        break;
      case "campfire":
        this.startCampfire();
        break;
      case "ocean":
        this.startOcean();
        break;
      case "forest":
        this.startForest();
        break;
    }

    if (minutesTimer && minutesTimer > 0) {
      this.timerMinutes = minutesTimer;
      this.timerId = setTimeout(() => {
        this.stop();
      }, minutesTimer * 60 * 1000);
    }
  }

  private createNoiseBuffer(type: "white" | "pink" | "brown"): AudioBuffer {
    if (!this.ctx) throw new Error("No context");
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds loop
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;

      if (type === "white") {
        data[i] = white * 0.15;
      } else if (type === "pink") {
        // Paul Kellet's filtered pink noise algorithm
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
        b6 = white * 0.115926;
      } else if (type === "brown") {
        // Brown noise integration
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 0.45;
      }
    }
    return buffer;
  }

  private startNoise(type: "white" | "pink" | "brown") {
    if (!this.ctx || !this.masterGain) return;
    const buffer = this.createNoiseBuffer(type);
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    source.connect(this.masterGain);
    source.start();
    this.activeNodes.push(source);
  }

  private startRain() {
    if (!this.ctx || !this.masterGain) return;

    // Background steady rainfall: filtered pink noise
    const buffer = this.createNoiseBuffer("pink");
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(900, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(this.masterGain);
    source.start();
    this.activeNodes.push(source, filter);

    // Subtle droplet pings generator
    const dropletBuffer = this.createNoiseBuffer("white");
    const dropletSource = this.ctx.createBufferSource();
    dropletSource.buffer = dropletBuffer;
    dropletSource.loop = true;

    const dropletFilter = this.ctx.createBiquadFilter();
    dropletFilter.type = "bandpass";
    dropletFilter.frequency.setValueAtTime(3200, this.ctx.currentTime);
    dropletFilter.Q.setValueAtTime(6, this.ctx.currentTime);

    const dropletGain = this.ctx.createGain();
    dropletGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    dropletSource.connect(dropletFilter);
    dropletFilter.connect(dropletGain);
    dropletGain.connect(this.masterGain);
    dropletSource.start();
    this.activeNodes.push(dropletSource, dropletFilter, dropletGain);
  }

  private startCampfire() {
    if (!this.ctx || !this.masterGain) return;

    // Warm base low rumble
    const brownBuffer = this.createNoiseBuffer("brown");
    const rumble = this.ctx.createBufferSource();
    rumble.buffer = brownBuffer;
    rumble.loop = true;

    const rumbleFilter = this.ctx.createBiquadFilter();
    rumbleFilter.type = "lowpass";
    rumbleFilter.frequency.setValueAtTime(350, this.ctx.currentTime);

    rumble.connect(rumbleFilter);
    rumbleFilter.connect(this.masterGain);
    rumble.start();
    this.activeNodes.push(rumble, rumbleFilter);

    // Crackle generator: high-pass filtered white noise with sporadic amplitude
    const crackleBuffer = this.createNoiseBuffer("white");
    const crackleSource = this.ctx.createBufferSource();
    crackleSource.buffer = crackleBuffer;
    crackleSource.loop = true;

    const crackleFilter = this.ctx.createBiquadFilter();
    crackleFilter.type = "highpass";
    crackleFilter.frequency.setValueAtTime(2400, this.ctx.currentTime);

    const crackleGain = this.ctx.createGain();
    crackleGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    crackleSource.connect(crackleFilter);
    crackleFilter.connect(crackleGain);
    crackleGain.connect(this.masterGain);
    crackleSource.start();
    this.activeNodes.push(crackleSource, crackleFilter, crackleGain);
  }

  private startOcean() {
    if (!this.ctx || !this.masterGain) return;

    // Wave roar
    const buffer = this.createNoiseBuffer("pink");
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);

    // LFO to simulate rolling wave tides (cycle every ~7 seconds)
    const waveGain = this.ctx.createGain();
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.14, this.ctx.currentTime); // ~7.1s wave period

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(waveGain.gain);

    source.connect(filter);
    filter.connect(waveGain);
    waveGain.connect(this.masterGain);

    source.start();
    lfo.start();
    this.activeNodes.push(source, filter, waveGain, lfo, lfoGain);
  }

  private startForest() {
    if (!this.ctx || !this.masterGain) return;

    const buffer = this.createNoiseBuffer("pink");
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    // Gentle wind gusts via slow LFO
    const windGain = this.ctx.createGain();
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.1, this.ctx.currentTime); // 10s wind sway
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(windGain.gain);

    source.connect(filter);
    filter.connect(windGain);
    windGain.connect(this.masterGain);

    source.start();
    lfo.start();
    this.activeNodes.push(source, filter, windGain, lfo, lfoGain);
  }
}

export const ambientAudioEngine = new AmbientSoundEngine();
