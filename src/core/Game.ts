import { GameRenderer } from '../rendering/GameRenderer';
import { GameLoop } from './GameLoop';

export class Game {
  private readonly loop: GameLoop;
  private readonly renderer: GameRenderer;
  private elapsedSeconds = 0;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new GameRenderer(canvas);
    this.loop = new GameLoop({
      update: (deltaSeconds) => {
        this.elapsedSeconds += deltaSeconds;
      },
      render: () => {
        this.renderer.render(this.elapsedSeconds);
      },
    });
  }

  start(): void {
    this.loop.start();
  }

  pause(): void {
    this.loop.pause();
  }

  resume(): void {
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
    this.renderer.dispose();
  }
}
