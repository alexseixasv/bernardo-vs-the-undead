export type SfxId = 'pulse' | 'sword' | 'hit' | 'gem' | 'levelUp' | 'upgrade' | 'hurt' | 'gameOver';

export interface OscillatorLike {
  type: string;
  frequency: { value: number };
  connect(node: unknown): unknown;
  start(when?: number): void;
  stop(when?: number): void;
}

export interface GainLike {
  gain: {
    value: number;
    setValueAtTime(value: number, time: number): void;
    linearRampToValueAtTime(value: number, time: number): void;
    exponentialRampToValueAtTime(value: number, time: number): void;
  };
  connect(node: unknown): unknown;
}

export interface AudioContextLike {
  currentTime: number;
  destination: unknown;
  state: string;
  createOscillator(): OscillatorLike;
  createGain(): GainLike;
  resume(): Promise<void>;
  close(): Promise<void>;
}

export type AudioContextFactory = () => AudioContextLike | null;

const SFX: Record<SfxId, { freq: number; duration: number; type: OscillatorType; gain: number }> = {
  pulse: { freq: 620, duration: 0.12, type: 'sine', gain: 0.09 },
  sword: { freq: 880, duration: 0.1, type: 'square', gain: 0.05 },
  hit: { freq: 180, duration: 0.08, type: 'sawtooth', gain: 0.07 },
  gem: { freq: 980, duration: 0.09, type: 'triangle', gain: 0.07 },
  levelUp: { freq: 523, duration: 0.22, type: 'sine', gain: 0.1 },
  upgrade: { freq: 740, duration: 0.12, type: 'triangle', gain: 0.08 },
  hurt: { freq: 140, duration: 0.16, type: 'sawtooth', gain: 0.08 },
  gameOver: { freq: 110, duration: 0.4, type: 'sine', gain: 0.1 },
};

export class AudioSystem {
  private readonly factory: AudioContextFactory;
  private context: AudioContextLike | null = null;
  private master: GainLike | null = null;
  private unlocked = false;
  private muted = false;
  private volume = 0.7;
  private disposed = false;

  constructor(factory: AudioContextFactory = defaultAudioContextFactory) {
    this.factory = factory;
  }

  isUnlocked(): boolean {
    return this.unlocked;
  }

  isMuted(): boolean {
    return this.muted;
  }

  getVolume(): number {
    return this.volume;
  }

  async unlock(): Promise<void> {
    if (this.disposed || this.unlocked) {
      return;
    }

    const context = this.ensureContext();
    if (context === null) {
      return;
    }

    try {
      if (context.state === 'suspended') {
        await context.resume();
      }
      this.unlocked = true;
      this.applyMasterGain();
    } catch {
      this.unlocked = false;
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.applyMasterGain();
  }

  toggleMuted(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  setVolume(volume: number): void {
    this.volume = Math.min(1, Math.max(0, volume));
    this.applyMasterGain();
  }

  play(id: SfxId): void {
    if (this.disposed || !this.unlocked || this.muted) {
      return;
    }

    const context = this.context;
    const master = this.master;
    if (context === null || master === null) {
      return;
    }

    const patch = SFX[id];
    try {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = patch.type;
      oscillator.frequency.value = patch.freq;
      const now = context.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(patch.gain, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + patch.duration);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(now);
      oscillator.stop(now + patch.duration + 0.03);
    } catch {
      // Autoplay or closed-context failures must not become uncaught errors.
    }
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    const context = this.context;
    this.context = null;
    this.master = null;
    if (context !== null) {
      void context.close().catch(() => undefined);
    }
  }

  private ensureContext(): AudioContextLike | null {
    if (this.context !== null) {
      return this.context;
    }

    try {
      const context = this.factory();
      if (context === null) {
        return null;
      }
      this.context = context;
      this.master = context.createGain();
      this.master.connect(context.destination);
      this.applyMasterGain();
      return context;
    } catch {
      return null;
    }
  }

  private applyMasterGain(): void {
    if (this.master === null || this.context === null) {
      return;
    }

    const value = this.muted || !this.unlocked ? 0 : this.volume;
    this.master.gain.value = value;
  }
}

export function defaultAudioContextFactory(): AudioContextLike | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const Ctor =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (Ctor === undefined) {
    return null;
  }

  try {
    return new Ctor() as unknown as AudioContextLike;
  } catch {
    return null;
  }
}
