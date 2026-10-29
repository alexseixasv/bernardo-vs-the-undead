export interface PerfSample {
  fps: number;
  frameMs: number;
  calls: number;
  triangles: number;
  enemies: number;
  gems: number;
}

export class PerformanceOverlay {
  private readonly root: HTMLElement;
  private frames = 0;
  private elapsed = 0;
  private fps = 0;
  private frameMs = 0;

  constructor() {
    this.root = document.createElement('div');
    this.root.id = 'perf-overlay';
    this.root.className = 'perf-overlay';
    this.root.setAttribute('aria-hidden', 'true');
    document.body.append(this.root);
  }

  update(deltaSeconds: number, sample: Omit<PerfSample, 'fps' | 'frameMs'>): void {
    this.frames += 1;
    this.elapsed += deltaSeconds;
    this.frameMs = deltaSeconds * 1000;
    if (this.elapsed >= 0.5) {
      this.fps = this.frames / this.elapsed;
      this.frames = 0;
      this.elapsed = 0;
    }

    this.root.textContent = [
      `FPS ${this.fps.toFixed(0)}`,
      `frame ${this.frameMs.toFixed(1)}ms`,
      `draw ${sample.calls}`,
      `tri ${sample.triangles}`,
      `skels ${sample.enemies}`,
      `gems ${sample.gems}`,
    ].join(' · ');
  }

  dispose(): void {
    this.root.remove();
  }
}
