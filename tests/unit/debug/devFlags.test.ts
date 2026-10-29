import { describe, expect, it } from 'vitest';

import { readDevFlags } from '../../../src/debug/devFlags';

describe('readDevFlags', () => {
  it('ignores query flags outside development builds', () => {
    expect(readDevFlags('perf=1&stress=50', false)).toEqual({ perf: false, stress: null });
  });

  it('reads perf and stress in development', () => {
    expect(readDevFlags('?perf&stress=30', true)).toEqual({ perf: true, stress: 30 });
  });
});
