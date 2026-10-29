export const FIXED_TIMESTEP_SECONDS = 1 / 60;
export const MAX_SIMULATION_STEPS_PER_FRAME = 5;

export type GameLoopStatus = 'idle' | 'running' | 'paused' | 'disposed';

export interface Clock {
  now(): number;
}

export type FrameCallback = (timeMs: number) => void;

export interface FrameScheduler {
  request(callback: FrameCallback): number;
  cancel(handle: number): void;
}

export interface GameLoopCallbacks {
  update(deltaSeconds: number): void;
  render(interpolationAlpha: number): void;
}

export interface GameLoopOptions extends GameLoopCallbacks {
  clock?: Clock;
  scheduler?: FrameScheduler;
}

const performanceClock: Clock = {
  now(): number {
    return performance.now() / 1000;
  },
};

const animationFrameScheduler: FrameScheduler = {
  request(callback: FrameCallback): number {
    return requestAnimationFrame(callback);
  },
  cancel(handle: number): void {
    cancelAnimationFrame(handle);
  },
};

export class GameLoop {
  private readonly update: (deltaSeconds: number) => void;
  private readonly render: (interpolationAlpha: number) => void;
  private readonly clock: Clock;
  private readonly scheduler: FrameScheduler;

  private status: GameLoopStatus = 'idle';
  private frameHandle: number | null = null;
  private lastTimeSeconds = 0;
  private accumulatorSeconds = 0;

  constructor(options: GameLoopOptions) {
    this.update = options.update;
    this.render = options.render;
    this.clock = options.clock ?? performanceClock;
    this.scheduler = options.scheduler ?? animationFrameScheduler;
  }

  getStatus(): GameLoopStatus {
    return this.status;
  }

  start(): void {
    this.assertNotDisposed();
    if (this.status === 'running' || this.status === 'paused') {
      return;
    }

    this.status = 'running';
    this.accumulatorSeconds = 0;
    this.lastTimeSeconds = this.clock.now();
    this.scheduleFrame();
  }

  pause(): void {
    this.assertNotDisposed();
    if (this.status !== 'running') {
      return;
    }

    this.status = 'paused';
  }

  resume(): void {
    this.assertNotDisposed();
    if (this.status !== 'paused') {
      return;
    }

    this.status = 'running';
    this.lastTimeSeconds = this.clock.now();
    if (this.frameHandle === null) {
      this.scheduleFrame();
    }
  }

  stop(): void {
    if (this.status === 'disposed') {
      return;
    }

    this.cancelFrame();
    this.status = 'idle';
    this.accumulatorSeconds = 0;
    this.lastTimeSeconds = 0;
  }

  dispose(): void {
    if (this.status === 'disposed') {
      return;
    }

    this.cancelFrame();
    this.status = 'disposed';
    this.accumulatorSeconds = 0;
    this.lastTimeSeconds = 0;
  }

  private assertNotDisposed(): void {
    if (this.status === 'disposed') {
      throw new Error('Cannot use a disposed GameLoop.');
    }
  }

  private scheduleFrame(): void {
    if (this.frameHandle !== null) {
      return;
    }

    this.frameHandle = this.scheduler.request(() => {
      this.frameHandle = null;
      this.tick();
    });
  }

  private cancelFrame(): void {
    if (this.frameHandle === null) {
      return;
    }

    this.scheduler.cancel(this.frameHandle);
    this.frameHandle = null;
  }

  private tick(): void {
    if (this.status !== 'running' && this.status !== 'paused') {
      return;
    }

    const now = this.clock.now();
    const frameDeltaSeconds = Math.max(0, now - this.lastTimeSeconds);
    this.lastTimeSeconds = now;

    if (this.status === 'running') {
      this.accumulatorSeconds += frameDeltaSeconds;

      let steps = 0;
      while (
        this.status === 'running' &&
        this.accumulatorSeconds >= FIXED_TIMESTEP_SECONDS &&
        steps < MAX_SIMULATION_STEPS_PER_FRAME
      ) {
        this.update(FIXED_TIMESTEP_SECONDS);
        this.accumulatorSeconds -= FIXED_TIMESTEP_SECONDS;
        steps += 1;
      }

      if (steps === MAX_SIMULATION_STEPS_PER_FRAME) {
        this.accumulatorSeconds = 0;
      }
    }

    const interpolationAlpha = Math.min(1, this.accumulatorSeconds / FIXED_TIMESTEP_SECONDS);
    this.render(interpolationAlpha);

    if (this.status === 'running' || this.status === 'paused') {
      this.scheduleFrame();
    }
  }
}
