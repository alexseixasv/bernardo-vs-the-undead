import { SKELETON_MAX_HEALTH, SKELETON_MOVE_SPEED, SKELETON_RADIUS } from '../config/combat';

export type EnemyLifecycle = 'alive' | 'dead';

export interface EnemyState {
  id: number;
  x: number;
  y: number;
  z: number;
  facingYaw: number;
  health: number;
  maxHealth: number;
  speed: number;
  radius: number;
  lifecycle: EnemyLifecycle;
  deathTimer: number;
  hitFlash: number;
}

export function createSkeletonWarrior(id: number, x: number, z: number): EnemyState {
  return {
    id,
    x,
    y: 0,
    z,
    facingYaw: 0,
    health: SKELETON_MAX_HEALTH,
    maxHealth: SKELETON_MAX_HEALTH,
    speed: SKELETON_MOVE_SPEED,
    radius: SKELETON_RADIUS,
    lifecycle: 'alive',
    deathTimer: 0,
    hitFlash: 0,
  };
}

export function cloneEnemyState(enemy: EnemyState): EnemyState {
  return { ...enemy };
}

export function isEnemyActive(enemy: EnemyState): boolean {
  return enemy.lifecycle === 'alive' && enemy.health > 0;
}
