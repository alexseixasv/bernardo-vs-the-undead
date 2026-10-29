import {
  MAX_ACTIVE_SKELETONS,
  SPAWN_ATTEMPTS,
  SPAWN_INITIAL_DELAY,
  SPAWN_INTERVAL,
  SPAWN_INTERVAL_DECAY_PER_SECOND,
  SPAWN_INTERVAL_MIN,
  SPAWN_SAFETY_RADIUS,
  SKELETON_RADIUS,
} from '../config/combat';
import { ARENA_HALF_EXTENT } from '../config/world';
import { createSkeletonWarrior, isEnemyActive, type EnemyState } from '../entities/enemy';
import type { PlayerState } from '../entities/player';
import type { RandomFn } from '../math/random';
import { clampToArenaXZ } from './MovementSystem';

export interface SpawnState {
  cooldown: number;
  nextId: number;
}

export function createSpawnState(): SpawnState {
  return {
    cooldown: SPAWN_INITIAL_DELAY,
    nextId: 1,
  };
}

export function spawnIntervalForElapsed(elapsedSeconds: number): number {
  return Math.max(
    SPAWN_INTERVAL_MIN,
    SPAWN_INTERVAL - elapsedSeconds * SPAWN_INTERVAL_DECAY_PER_SECOND,
  );
}

export function countActiveEnemies(enemies: readonly EnemyState[]): number {
  let count = 0;
  for (const enemy of enemies) {
    if (isEnemyActive(enemy)) {
      count += 1;
    }
  }
  return count;
}

export function pickSpawnPosition(
  player: PlayerState,
  random: RandomFn,
  safetyRadius: number = SPAWN_SAFETY_RADIUS,
  arenaHalfExtent: number = ARENA_HALF_EXTENT,
  radius: number = SKELETON_RADIUS,
): { x: number; z: number } {
  let best = { x: player.x + safetyRadius, z: player.z };
  let bestDistance = 0;

  for (let attempt = 0; attempt < SPAWN_ATTEMPTS; attempt += 1) {
    const angle = random() * Math.PI * 2;
    const distance = safetyRadius + random() * safetyRadius;
    const unclampedX = player.x + Math.cos(angle) * distance;
    const unclampedZ = player.z + Math.sin(angle) * distance;
    const clamped = clampToArenaXZ(unclampedX, unclampedZ, radius, arenaHalfExtent);
    const fromPlayer = Math.hypot(clamped.x - player.x, clamped.z - player.z);
    if (fromPlayer > bestDistance) {
      best = clamped;
      bestDistance = fromPlayer;
    }
    if (fromPlayer >= safetyRadius - 1e-6) {
      return clamped;
    }
  }

  return best;
}

export function trySpawnSkeleton(
  spawn: SpawnState,
  player: PlayerState,
  enemies: readonly EnemyState[],
  elapsedSeconds: number,
  deltaSeconds: number,
  random: RandomFn,
  maxActive: number = MAX_ACTIVE_SKELETONS,
): { spawn: SpawnState; enemy: EnemyState | null } {
  const next: SpawnState = {
    cooldown: spawn.cooldown - deltaSeconds,
    nextId: spawn.nextId,
  };

  if (next.cooldown > 0 || countActiveEnemies(enemies) >= maxActive) {
    if (next.cooldown < 0) {
      next.cooldown = 0;
    }
    return { spawn: next, enemy: null };
  }

  const position = pickSpawnPosition(player, random);
  const enemy = createSkeletonWarrior(next.nextId, position.x, position.z);
  next.nextId += 1;
  next.cooldown = spawnIntervalForElapsed(elapsedSeconds);
  return { spawn: next, enemy };
}
