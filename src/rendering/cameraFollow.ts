import { CAMERA_FOLLOW_SHARPNESS, CAMERA_OFFSET } from '../config/world';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface CameraPose {
  lookAt: Vec3;
  position: Vec3;
}

export function stepCameraFollow(
  lookAt: Vec3,
  target: Vec3,
  deltaSeconds: number,
  sharpness: number = CAMERA_FOLLOW_SHARPNESS,
  offset: Vec3 = CAMERA_OFFSET,
): CameraPose {
  const follow = 1 - Math.exp(-sharpness * Math.max(0, deltaSeconds));
  const nextLookAt = {
    x: lookAt.x + (target.x - lookAt.x) * follow,
    y: lookAt.y + (target.y - lookAt.y) * follow,
    z: lookAt.z + (target.z - lookAt.z) * follow,
  };

  return {
    lookAt: nextLookAt,
    position: {
      x: nextLookAt.x + offset.x,
      y: nextLookAt.y + offset.y,
      z: nextLookAt.z + offset.z,
    },
  };
}
