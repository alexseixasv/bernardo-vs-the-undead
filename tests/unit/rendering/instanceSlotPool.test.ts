import { describe, expect, it } from 'vitest';

import { InstanceSlotPool } from '../../../src/rendering/instanceSlotPool';

describe('InstanceSlotPool', () => {
  it('maps ids to dense slots and reuses the last slot on release', () => {
    const pool = new InstanceSlotPool(4);
    expect(pool.acquire(10)).toBe(0);
    expect(pool.acquire(20)).toBe(1);
    expect(pool.acquire(30)).toBe(2);
    expect(pool.get(20)).toBe(1);
    expect(pool.size).toBe(3);

    const released = pool.release(10);
    expect(released).toEqual({ vacated: 0, swappedFrom: 2 });
    expect(pool.get(30)).toBe(0);
    expect(pool.has(10)).toBe(false);
    expect(pool.size).toBe(2);
    expect(pool.acquire(40)).toBe(2);
  });

  it('returns the same slot for an existing id and null when full', () => {
    const pool = new InstanceSlotPool(2);
    expect(pool.acquire(1)).toBe(0);
    expect(pool.acquire(1)).toBe(0);
    expect(pool.acquire(2)).toBe(1);
    expect(pool.acquire(3)).toBeNull();
  });

  it('does not leave duplicate ids after restart', () => {
    const pool = new InstanceSlotPool(3);
    pool.acquire(1);
    pool.acquire(2);
    pool.release(1);
    pool.reset();
    expect(pool.size).toBe(0);
    expect(pool.ids()).toEqual([]);
    expect(pool.acquire(1)).toBe(0);
    expect(pool.acquire(2)).toBe(1);
  });
});
