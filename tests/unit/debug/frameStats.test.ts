import { describe, expect, it } from 'vitest';

import { average, median, percentile } from '../../../src/debug/frameStats';

describe('frameStats', () => {
  it('computes average, median, and p95 without mutating input', () => {
    const values = [16, 17, 16, 33, 16];
    expect(average(values)).toBeCloseTo(19.6);
    expect(median(values)).toBe(16);
    expect(percentile(values, 0.95)).toBe(33);
    expect(values).toEqual([16, 17, 16, 33, 16]);
  });

  it('returns 0 for empty samples', () => {
    expect(average([])).toBe(0);
    expect(median([])).toBe(0);
    expect(percentile([], 0.95)).toBe(0);
  });
});
