import { AudioSystem } from '../audio/AudioSystem';
import { detectSfx } from '../audio/detectSfx';
import { PerformanceOverlay } from '../debug/PerformanceOverlay';
import { readDevFlags } from '../debug/devFlags';
import { KeyboardInput } from '../input/KeyboardInput';
import { GameRenderer } from '../rendering/GameRenderer';
import { Hud } from '../ui/Hud';
import { World, type WorldSnapshot } from '../world/World';
import { GameLoop } from './GameLoop';

export class Game {
  private readonly loop: GameLoop;
  private readonly renderer: GameRenderer;
  private readonly world: World;
  private readonly input: KeyboardInput;
  private readonly hud: Hud;
  private readonly audio: AudioSystem;
  private readonly perf: PerformanceOverlay | null;
  private lastRenderSeconds: number | null = null;
  private lastSnapshot: WorldSnapshot | null = null;
  private disposed = false;
  private readonly unlockAudio = (): void => {
    void this.audio.unlock();
  };

  constructor(canvas: HTMLCanvasElement) {
    const flags = readDevFlags();
    this.world = new World(
      flags.stress === null ? {} : { maxActiveSkeletons: flags.stress, stressFill: true },
    );
    this.input = new KeyboardInput();
    this.renderer = new GameRenderer(canvas);
    this.audio = new AudioSystem();
    this.hud = new Hud({
      onRestart: () => {
        this.restart();
      },
      onSelectUpgrade: (index) => {
        this.selectUpgrade(index);
      },
      onToggleMute: () => {
        const muted = this.audio.toggleMuted();
        this.hud.setMuted(muted);
        void this.audio.unlock();
      },
    });
    this.hud.setMuted(this.audio.isMuted());
    this.perf = flags.perf ? new PerformanceOverlay() : null;
    window.addEventListener('pointerdown', this.unlockAudio);
    window.addEventListener('keydown', this.unlockAudio);
    this.loop = new GameLoop({
      update: (deltaSeconds) => {
        this.world.step(deltaSeconds, this.input.getIntent());
        const status = this.world.getStatus();
        if (status === 'gameOver' || status === 'levelUp') {
          this.loop.pause();
        }
      },
      render: (interpolationAlpha) => {
        const snapshot = this.world.getSnapshot(interpolationAlpha);
        const delta = this.consumeRenderDelta();
        this.renderer.render(snapshot, delta);
        this.hud.sync(snapshot);
        this.playObservedSfx(snapshot);
        this.lastSnapshot = snapshot;
        if (this.perf !== null) {
          this.perf.update(delta, this.renderer.getStats());
        }
      },
    });
  }

  start(): void {
    this.lastRenderSeconds = null;
    this.loop.start();
  }

  pause(): void {
    this.loop.pause();
  }

  resume(): void {
    this.lastRenderSeconds = null;
    this.loop.resume();
  }

  stop(): void {
    this.loop.stop();
  }

  restart(): void {
    if (this.disposed) {
      return;
    }

    this.world.reset();
    this.renderer.resetForNewRun();
    this.lastRenderSeconds = null;
    this.lastSnapshot = null;
    this.hud.sync(this.world.getSnapshot(1));

    if (this.loop.getStatus() === 'paused') {
      this.loop.resume();
      return;
    }

    if (this.loop.getStatus() === 'idle') {
      this.loop.start();
    }
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    window.removeEventListener('pointerdown', this.unlockAudio);
    window.removeEventListener('keydown', this.unlockAudio);
    this.loop.dispose();
    this.input.dispose();
    this.hud.dispose();
    this.audio.dispose();
    this.perf?.dispose();
    this.renderer.dispose();
  }

  private selectUpgrade(index: number): void {
    if (this.disposed) {
      return;
    }

    const applied = this.world.chooseUpgrade(index);
    if (!applied) {
      return;
    }

    this.audio.play('upgrade');
    this.lastRenderSeconds = null;
    this.hud.sync(this.world.getSnapshot(1));

    if (this.world.getStatus() === 'playing' && this.loop.getStatus() === 'paused') {
      this.loop.resume();
    }
  }

  private playObservedSfx(snapshot: WorldSnapshot): void {
    for (const id of detectSfx(this.lastSnapshot, snapshot)) {
      this.audio.play(id);
    }
  }

  private consumeRenderDelta(): number {
    const now = performance.now() / 1000;
    const previous = this.lastRenderSeconds;
    this.lastRenderSeconds = now;

    if (previous === null) {
      return 0;
    }

    return Math.min(0.05, Math.max(0, now - previous));
  }
}
