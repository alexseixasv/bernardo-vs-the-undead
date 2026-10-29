import { ARENA_HALF_EXTENT, PLAYER_MOVE_SPEED } from '../config/world';
import type { PlayerState } from '../entities/player';
import type { InputIntent } from '../input/InputIntent';
import { screenIntentToWorld } from '../input/isometric';

export interface MovementConfig {
  speed: number;
  arenaHalfExtent: number;
}

const DEFAULT_MOVEMENT_CONFIG: MovementConfig = {
  speed: PLAYER_MOVE_SPEED,
  arenaHalfExtent: ARENA_HALF_EXTENT,
};

export function movePlayer(
  player: PlayerState,
  intent: InputIntent,
  deltaSeconds: number,
  config: MovementConfig = DEFAULT_MOVEMENT_CONFIG,
): PlayerState {
  const world = screenIntentToWorld(intent);
  const next: PlayerState = {
    ...player,
  };

  const travel = config.speed * deltaSeconds;
  next.x += world.x * travel;
  next.z += world.z * travel;

  if (world.x !== 0 || world.z !== 0) {
    next.facingYaw = Math.atan2(world.x, world.z);
  }

  return clampToArena(next, config.arenaHalfExtent);
}

export function clampToArena(player: PlayerState, arenaHalfExtent: number): PlayerState {
  const clamped = clampToArenaXZ(player.x, player.z, player.radius, arenaHalfExtent);
  return {
    ...player,
    x: clamped.x,
    z: clamped.z,
  };
}

export function clampToArenaXZ(
  x: number,
  z: number,
  radius: number,
  arenaHalfExtent: number,
): { x: number; z: number } {
  const limit = arenaHalfExtent - radius;
  return {
    x: clamp(x, -limit, limit),
    z: clamp(z, -limit, limit),
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
