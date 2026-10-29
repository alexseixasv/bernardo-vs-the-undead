import { KeyboardInput } from '../input/KeyboardInput';
import { GameRenderer } from '../rendering/GameRenderer';
import { World } from '../world/World';
import { GameLoop } from './GameLoop';

export class Game {
  private readonly loop: GameLoop;
  private readonly renderer: GameRenderer;
  private readonly world: World;
  private readonly input: KeyboardInput;
  private lastRenderSeconds: number | null = null;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement) {
    this.world = new World();
    this.input = new KeyboardInput();
    this.renderer = new GameRenderer(canvas);
    this.loop = new GameLoop({
      update: (deltaSeconds) => {
        this.world.step(deltaSeconds, this.input.getIntent());
      },
      render: (interpolationAlpha) => {
        this.renderer.render(this.world.getSnapshot(interpolationAlpha), this.consumeRenderDelta());
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

  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.loop.dispose();
    this.input.dispose();
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
