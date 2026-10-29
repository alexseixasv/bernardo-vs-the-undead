import { describe, expect, it } from 'vitest';

import { createInputIntent, intentLength } from '../../../src/input/InputIntent';
import { screenIntentToWorld } from '../../../src/input/isometric';

describe('createInputIntent', () => {
  it('keeps axis-aligned input unchanged', () => {
    expect(createInputIntent(1, 0)).toEqual({ axisX: 1, axisY: 0 });
    expect(createInputIntent(0, -1)).toEqual({ axisX: 0, axisY: -1 });
  });

  it('normalizes diagonal input to unit length', () => {
    const intent = createInputIntent(1, 1);

    expect(intentLength(intent)).toBeCloseTo(1);
    expect(intent.axisX).toBeCloseTo(Math.SQRT1_2);
    expect(intent.axisY).toBeCloseTo(Math.SQRT1_2);
  });

  it('cancels opposite directions', () => {
    expect(createInputIntent(1 - 1, 1 - 1)).toEqual({ axisX: 0, axisY: 0 });
  });
});

describe('screenIntentToWorld', () => {
  it('maps screen up toward world -X -Z', () => {
    const world = screenIntentToWorld({ axisX: 0, axisY: 1 });

    expect(world.x).toBeCloseTo(-Math.SQRT1_2);
    expect(world.z).toBeCloseTo(-Math.SQRT1_2);
  });

  it('maps screen right toward world +X -Z', () => {
    const world = screenIntentToWorld({ axisX: 1, axisY: 0 });

    expect(world.x).toBeCloseTo(Math.SQRT1_2);
    expect(world.z).toBeCloseTo(-Math.SQRT1_2);
  });

  it('keeps isometric diagonal movement at unit length', () => {
    const intent = createInputIntent(1, 1);
    const world = screenIntentToWorld(intent);

    expect(Math.hypot(world.x, world.z)).toBeCloseTo(1);
  });
});
