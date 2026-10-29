import { describe, expect, it } from 'vitest';

import { PLAYER_MOVE_SPEED } from '../../../src/config/world';
import { createInputIntent } from '../../../src/input/InputIntent';
import { World } from '../../../src/world/World';

describe('World', () => {
  it('interpolates between previous and current simulation states', () => {
    const world = new World();
    world.step(1, createInputIntent(1, 0));

    const start = world.getSnapshot(0);
    const mid = world.getSnapshot(0.5);
    const end = world.getSnapshot(1);

    expect(Math.hypot(end.x, end.z)).toBeCloseTo(PLAYER_MOVE_SPEED);
    expect(mid.x).toBeCloseTo((start.x + end.x) / 2);
    expect(mid.z).toBeCloseTo((start.z + end.z) / 2);
  });
});
