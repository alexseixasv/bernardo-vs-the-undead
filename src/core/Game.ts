import { KeyboardInput } from '../input/KeyboardInput';
import { GameRenderer } from '../rendering/GameRenderer';
import { Hud } from '../ui/Hud';
import { World } from '../world/World';
import { GameLoop } from './GameLoop';

export class Game {
  private readonly loop: GameLoop;
  private readonly renderer: GameRenderer;
  private readonly world: World;
  private readonly input: KeyboardInput;
  private readonly hud: Hud;
  private lastRenderSeconds: number | null = null;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement) {
    this.world = new World();
    this.input = new KeyboardInput();
    this.renderer = new GameRenderer(canvas);
    this.hud = new Hud(() => {
      this.restart();
    });
    this.loop = new GameLoop({
      update: (deltaSeconds) => {
        this.world.step(deltaSeconds, this.input.getIntent());
        if (this.world.getStatus() === 'gameOver') {
          this.loop.pause();
        }
      },
      render: (interpolationAlpha) => {
        const snapshot = this.world.getSnapshot(interpolationAlpha);
        this.renderer.render(snapshot, this.consumeRenderDelta());
        this.hud.sync(snapshot);
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
    this.loop.dispose();
    this.input.dispose();
    this.hud.dispose();
    this.renderer.dispose();
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
