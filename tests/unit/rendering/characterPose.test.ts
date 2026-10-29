import { describe, expect, it } from 'vitest';

import { selectBernardoAnim, selectSkeletonAnim } from '../../../src/rendering/characterPose';

describe('selectBernardoAnim', () => {
  it('prefers defeat over hurt and walk', () => {
    expect(selectBernardoAnim({ moving: true, hurtAmount: 1, defeated: true })).toBe('defeat');
  });

  it('uses hurt, walk, then idle', () => {
    expect(selectBernardoAnim({ moving: true, hurtAmount: 0.4, defeated: false })).toBe('hurt');
    expect(selectBernardoAnim({ moving: true, hurtAmount: 0, defeated: false })).toBe('walk');
    expect(selectBernardoAnim({ moving: false, hurtAmount: 0, defeated: false })).toBe('idle');
  });
});

describe('selectSkeletonAnim', () => {
  it('prefers death, then hit, contact, walk, and idle', () => {
    expect(
      selectSkeletonAnim({ moving: true, contacting: true, hitAmount: 1, lifecycle: 'dead' }),
    ).toBe('death');
    expect(
      selectSkeletonAnim({ moving: true, contacting: true, hitAmount: 0.5, lifecycle: 'alive' }),
    ).toBe('hit');
    expect(
      selectSkeletonAnim({ moving: true, contacting: true, hitAmount: 0, lifecycle: 'alive' }),
    ).toBe('contact');
    expect(
      selectSkeletonAnim({ moving: true, contacting: false, hitAmount: 0, lifecycle: 'alive' }),
    ).toBe('walk');
    expect(
      selectSkeletonAnim({ moving: false, contacting: false, hitAmount: 0, lifecycle: 'alive' }),
    ).toBe('idle');
  });
});
