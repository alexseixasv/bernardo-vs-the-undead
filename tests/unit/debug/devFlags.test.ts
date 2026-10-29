import { describe, expect, it } from 'vitest';

import { readDevFlags } from '../../../src/debug/devFlags';

describe('readDevFlags', () => {
  it('ignores query flags outside development builds', () => {
    expect(readDevFlags('perf=1&stress=50&bench', false)).toEqual({
      perf: false,
      stress: null,
      bench: false,
    });
  });

  it('reads perf, stress, and bench in development', () => {
    expect(readDevFlags('?perf&stress=30&bench', true)).toEqual({
      perf: true,
      stress: 30,
      bench: true,
    });
  });

  it('clamps stress to the documented maximum', () => {
    expect(readDevFlags('?stress=500', true).stress).toBe(200);
  });
});
