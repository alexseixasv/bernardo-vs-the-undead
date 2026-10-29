import { describe, expect, it } from 'vitest';

import { computeSkeletonPartPose, skeletonHitTint } from '../../../src/rendering/skeletonPartPose';

describe('computeSkeletonPartPose', () => {
  it('swings opposite limbs while walking', () => {
    const pose = computeSkeletonPartPose('walk', 0.2, 0, 0, 0);
    expect(pose.leftArmRotX).toBeCloseTo(-pose.rightArmRotX);
    expect(pose.leftLegRotX).toBeCloseTo(-pose.rightLegRotX);
    expect(pose.bodyY).toBeGreaterThanOrEqual(0);
  });

  it('tilts and shrinks on death without moving the root horizontally', () => {
    const pose = computeSkeletonPartPose('death', 1, 0, 1, 0);
    expect(pose.bodyRotX).toBeCloseTo(1.35);
    expect(pose.rootScale).toBeLessThan(1);
    expect(pose.bodyY).toBeLessThan(0);
  });

  it('keeps idle motion smaller than a walk stride', () => {
    const idle = computeSkeletonPartPose('idle', 0.4, 0, 0, 0);
    const walk = computeSkeletonPartPose('walk', 0.4, 0, 0, 0);
    expect(Math.abs(idle.leftArmRotX)).toBeLessThan(Math.abs(walk.leftArmRotX) + 0.01);
  });
});

describe('skeletonHitTint', () => {
  it('stays white at rest and reddens on hit', () => {
    expect(skeletonHitTint(0)).toEqual({ r: 1, g: 1, b: 1 });
    const hit = skeletonHitTint(1);
    expect(hit.g).toBeLessThan(1);
    expect(hit.b).toBeLessThan(hit.g);
  });
});
