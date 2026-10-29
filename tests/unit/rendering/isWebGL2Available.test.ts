import { describe, expect, it } from 'vitest';

import { isWebGL2Available } from '../../../src/rendering/webgl';

describe('isWebGL2Available', () => {
  it('returns true when a WebGL2 context can be created', () => {
    expect(
      isWebGL2Available(() => ({
        getContext: () => ({}),
      })),
    ).toBe(true);
  });

  it('returns false when the context is missing or construction throws', () => {
    expect(
      isWebGL2Available(() => ({
        getContext: () => null,
      })),
    ).toBe(false);

    expect(
      isWebGL2Available(() => {
        throw new Error('canvas unavailable');
      }),
    ).toBe(false);
  });
});
