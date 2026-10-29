import { ARENA_HALF_EXTENT } from '../config/world';
import { isEnemyActive, type EnemyState } from '../entities/enemy';
import type { PlayerState } from '../entities/player';
import { clampToArenaXZ } from './MovementSystem';

const ZERO_DISTANCE = 1e-8;

export function pursuePlayer(
  enemy: EnemyState,
  player: PlayerState,
  deltaSeconds: number,
  arenaHalfExtent: number = ARENA_HALF_EXTENT,
): EnemyState {
  if (!isEnemyActive(enemy)) {
    return enemy;
  }

  const dx = player.x - enemy.x;
  const dz = player.z - enemy.z;
  const distance = Math.hypot(dx, dz);
  if (distance < ZERO_DISTANCE) {
    return enemy;
  }

  const next: EnemyState = {
    ...enemy,
    facingYaw: Math.atan2(dx, dz),
  };

  const stopDistance = player.radius + enemy.radius;
  if (distance <= stopDistance) {
    return next;
  }

  const travel = Math.min(enemy.speed * deltaSeconds, distance - stopDistance);
  const step = travel / distance;
  const clamped = clampToArenaXZ(
    enemy.x + dx * step,
    enemy.z + dz * step,
    enemy.radius,
    arenaHalfExtent,
  );
  next.x = clamped.x;
  next.z = clamped.z;
  return next;
}
