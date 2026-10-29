import { average, median, percentile } from './frameStats';

export interface PerfSample {
  fps: number;
  frameMs: number;
  medianMs: number;
  p95Ms: number;
  simMs: number;
  renderMs: number;
  calls: number;
  triangles: number;
  geometries: number;
  textures: number;
  enemies: number;
  gems: number;
  heapMb: number | null;
}

const WINDOW_SIZE = 180;

export class PerformanceOverlay {
  private readonly root: HTMLElement;
  private readonly frames: number[] = [];
  private readonly sim: number[] = [];
  private readonly render: number[] = [];
  private elapsed = 0;
  private fps = 0;
  private frameMs = 0;
  private medianMs = 0;
  private p95Ms = 0;
  private simMs = 0;
  private renderMs = 0;

  constructor() {
    this.root = document.createElement('div');
    this.root.id = 'perf-overlay';
    this.root.className = 'perf-overlay';
    this.root.setAttribute('aria-hidden', 'true');
    document.body.append(this.root);
  }

  update(
    deltaSeconds: number,
    sample: Omit<PerfSample, 'fps' | 'frameMs' | 'medianMs' | 'p95Ms'> & {
      simMs: number;
      renderMs: number;
    },
  ): void {
    this.frameMs = deltaSeconds * 1000;
    this.frames.push(this.frameMs);
    this.sim.push(sample.simMs);
    this.render.push(sample.renderMs);
    if (this.frames.length > WINDOW_SIZE) {
      this.frames.shift();
      this.sim.shift();
      this.render.shift();
    }

    this.elapsed += deltaSeconds;
    if (this.elapsed >= 0.5) {
      this.fps = this.frames.length > 0 ? 1000 / average(this.frames) : 0;
      this.medianMs = median(this.frames);
      this.p95Ms = percentile(this.frames, 0.95);
      this.simMs = average(this.sim);
      this.renderMs = average(this.render);
      this.elapsed = 0;
      this.root.textContent = [
        `FPS ${this.fps.toFixed(0)}`,
        `med ${this.medianMs.toFixed(1)}ms`,
        `p95 ${this.p95Ms.toFixed(1)}ms`,
        `sim ${this.simMs.toFixed(2)}ms`,
        `rend ${this.renderMs.toFixed(2)}ms`,
        `draw ${sample.calls}`,
        `tri ${sample.triangles}`,
        `skels ${sample.enemies}`,
        `gems ${sample.gems}`,
        sample.heapMb === null ? 'heap n/a' : `heap ${sample.heapMb.toFixed(0)}MB`,
      ].join(' · ');
    }
  }

  snapshot(): Pick<PerfSample, 'fps' | 'frameMs' | 'medianMs' | 'p95Ms' | 'simMs' | 'renderMs'> {
    return {
      fps: this.fps,
      frameMs: this.frameMs,
      medianMs: this.medianMs,
      p95Ms: this.p95Ms,
      simMs: this.simMs,
      renderMs: this.renderMs,
    };
  }

  dispose(): void {
    this.root.remove();
  }
}

export function readJsHeapMb(): number | null {
  const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
  if (memory === undefined || !Number.isFinite(memory.usedJSHeapSize)) {
    return null;
  }
  return memory.usedJSHeapSize / 1_048_576;
}
