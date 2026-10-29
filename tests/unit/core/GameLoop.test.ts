import { describe, expect, it } from 'vitest';

import {
  FIXED_TIMESTEP_SECONDS,
  type FrameCallback,
  type FrameScheduler,
  GameLoop,
  MAX_SIMULATION_STEPS_PER_FRAME,
} from '../../../src/core/GameLoop';

class ManualClock {
  time = 0;

  now(): number {
    return this.time;
  }
}

class ManualScheduler implements FrameScheduler {
  private nextHandle = 1;
  private readonly pending = new Map<number, FrameCallback>();

  request(callback: FrameCallback): number {
    const handle = this.nextHandle;
    this.nextHandle += 1;
    this.pending.set(handle, callback);
    return handle;
  }

  cancel(handle: number): void {
    this.pending.delete(handle);
  }

  get pendingCount(): number {
    return this.pending.size;
  }

  tick(): void {
    const callbacks = [...this.pending.values()];
    this.pending.clear();
    for (const callback of callbacks) {
      callback(0);
    }
  }
}

function createLoop() {
  const clock = new ManualClock();
  const scheduler = new ManualScheduler();
  const updates: number[] = [];
  const renders: number[] = [];

  const loop = new GameLoop({
    clock,
    scheduler,
    update(deltaSeconds) {
      updates.push(deltaSeconds);
    },
    render(interpolationAlpha) {
      renders.push(interpolationAlpha);
    },
  });

  return { clock, scheduler, updates, renders, loop };
}

describe('GameLoop', () => {
  it('does not schedule frames until start is called', () => {
    const { loop, scheduler } = createLoop();

    expect(loop.getStatus()).toBe('idle');
    expect(scheduler.pendingCount).toBe(0);
  });

  it('starts a single animation frame and ignores duplicate start calls', () => {
    const { loop, scheduler } = createLoop();

    loop.start();
    loop.start();

    expect(loop.getStatus()).toBe('running');
    expect(scheduler.pendingCount).toBe(1);
  });

  it('accumulates elapsed time into fixed simulation steps', () => {
    const { clock, loop, scheduler, updates, renders } = createLoop();

    loop.start();
    clock.time = FIXED_TIMESTEP_SECONDS * 2.5;
    scheduler.tick();

    expect(updates).toEqual([FIXED_TIMESTEP_SECONDS, FIXED_TIMESTEP_SECONDS]);
    expect(renders).toHaveLength(1);
    expect(renders[0]).toBeCloseTo(0.5);
    expect(scheduler.pendingCount).toBe(1);
  });

  it('drops leftover time after the maximum catch-up steps', () => {
    const { clock, loop, scheduler, updates } = createLoop();

    loop.start();
    clock.time = FIXED_TIMESTEP_SECONDS * 40;
    scheduler.tick();

    expect(updates).toHaveLength(MAX_SIMULATION_STEPS_PER_FRAME);
    expect(updates.every((delta) => delta === FIXED_TIMESTEP_SECONDS)).toBe(true);

    clock.time += FIXED_TIMESTEP_SECONDS;
    scheduler.tick();

    expect(updates).toHaveLength(MAX_SIMULATION_STEPS_PER_FRAME + 1);
  });

  it('skips simulation while paused and still renders', () => {
    const { clock, loop, scheduler, updates, renders } = createLoop();

    loop.start();
    clock.time = FIXED_TIMESTEP_SECONDS;
    scheduler.tick();
    expect(updates).toHaveLength(1);

    loop.pause();
    clock.time += FIXED_TIMESTEP_SECONDS * 8;
    scheduler.tick();

    expect(loop.getStatus()).toBe('paused');
    expect(updates).toHaveLength(1);
    expect(renders).toHaveLength(2);
    expect(scheduler.pendingCount).toBe(1);
  });

  it('does not catch up paused time after resume', () => {
    const { clock, loop, scheduler, updates } = createLoop();

    loop.start();
    loop.pause();
    clock.time = 10;
    scheduler.tick();

    loop.resume();
    clock.time += FIXED_TIMESTEP_SECONDS;
    scheduler.tick();

    expect(loop.getStatus()).toBe('running');
    expect(updates).toEqual([FIXED_TIMESTEP_SECONDS]);
  });

  it('treats repeated pause and resume calls as safe no-ops', () => {
    const { loop, scheduler } = createLoop();

    loop.pause();
    loop.resume();
    loop.start();
    loop.pause();
    loop.pause();
    loop.resume();
    loop.resume();

    expect(loop.getStatus()).toBe('running');
    expect(scheduler.pendingCount).toBe(1);
  });

  it('stops the animation frame and can start again', () => {
    const { clock, loop, scheduler, updates } = createLoop();

    loop.start();
    loop.stop();

    expect(loop.getStatus()).toBe('idle');
    expect(scheduler.pendingCount).toBe(0);

    scheduler.tick();
    expect(updates).toHaveLength(0);

    clock.time = 0;
    loop.start();
    clock.time = FIXED_TIMESTEP_SECONDS;
    scheduler.tick();

    expect(updates).toEqual([FIXED_TIMESTEP_SECONDS]);
  });

  it('cancels the scheduled frame on dispose and rejects later starts', () => {
    const { loop, scheduler } = createLoop();

    loop.start();
    loop.dispose();
    loop.dispose();

    expect(loop.getStatus()).toBe('disposed');
    expect(scheduler.pendingCount).toBe(0);
    expect(() => loop.start()).toThrow(/disposed/i);
  });

  it('does not schedule another frame when dispose runs during render', () => {
    const clock = new ManualClock();
    const scheduler = new ManualScheduler();
    const loop = new GameLoop({
      clock,
      scheduler,
      update() {
        /* simulation is unused in this lifecycle test */
      },
      render() {
        loop.dispose();
      },
    });

    loop.start();
    scheduler.tick();

    expect(loop.getStatus()).toBe('disposed');
    expect(scheduler.pendingCount).toBe(0);
  });
});
