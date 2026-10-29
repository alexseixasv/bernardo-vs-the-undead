import { describe, expect, it } from 'vitest';

import { CAMERA_OFFSET } from '../../../src/config/world';
import { stepCameraFollow } from '../../../src/rendering/cameraFollow';

describe('stepCameraFollow', () => {
  it('keeps a fixed isometric offset from the look-at point', () => {
    const pose = stepCameraFollow({ x: 0, y: 1, z: 0 }, { x: 4, y: 1, z: -2 }, 1, 100);

    expect(pose.position.x - pose.lookAt.x).toBeCloseTo(CAMERA_OFFSET.x);
    expect(pose.position.y - pose.lookAt.y).toBeCloseTo(CAMERA_OFFSET.y);
    expect(pose.position.z - pose.lookAt.z).toBeCloseTo(CAMERA_OFFSET.z);
  });

  it('moves toward the target without rotating the offset', () => {
    const start = { x: 0, y: 1, z: 0 };
    const target = { x: 10, y: 1, z: 0 };
    const pose = stepCameraFollow(start, target, 0.1, 8);

    expect(pose.lookAt.x).toBeGreaterThan(start.x);
    expect(pose.lookAt.x).toBeLessThan(target.x);
    expect(pose.lookAt.z).toBeCloseTo(0);
  });

  it('does not jump when delta time is zero', () => {
    const pose = stepCameraFollow({ x: 2, y: 1, z: 3 }, { x: 9, y: 1, z: 8 }, 0, 12);

    expect(pose.lookAt).toEqual({ x: 2, y: 1, z: 3 });
  });
});
