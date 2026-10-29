export const PLAYER_MOVE_SPEED = 6;
export const PLAYER_RADIUS = 0.4;
export const PLAYER_LOOK_HEIGHT = 0.85;

export const ARENA_HALF_EXTENT = 16;

export const CAMERA_OFFSET = {
  x: 18,
  y: 17,
  z: 18,
} as const;

export const CAMERA_FOLLOW_SHARPNESS = 10;
export const CAMERA_SHAKE_AMOUNT = 0.06;
export const CAMERA_FOV = 38;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 120;

/**
 * Camera sits at +X+Y+Z looking toward the origin, so screen directions
 * map onto the XZ plane as follows:
 *
 * - W / ArrowUp: screen up → world (-X, -Z)
 * - S / ArrowDown: screen down → world (+X, +Z)
 * - D / ArrowRight: screen right → world (+X, -Z)
 * - A / ArrowLeft: screen left → world (-X, +Z)
 */
export const ISOMETRIC_SCREEN_UP = {
  x: -Math.SQRT1_2,
  z: -Math.SQRT1_2,
} as const;

export const ISOMETRIC_SCREEN_RIGHT = {
  x: Math.SQRT1_2,
  z: -Math.SQRT1_2,
} as const;
