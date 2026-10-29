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
    x: player.x,
    y: player.y,
    z: player.z,
    facingYaw: player.facingYaw,
    radius: player.radius,
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
  const limit = arenaHalfExtent - player.radius;
  return {
    ...player,
    x: clamp(player.x, -limit, limit),
    z: clamp(player.z, -limit, limit),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
