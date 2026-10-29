import {
  ATTACK_PULSE_DURATION,
  DEATH_DURATION,
  HIT_FLASH_DURATION,
  PLAYER_ATTACK_COOLDOWN,
  PLAYER_ATTACK_DAMAGE,
  PLAYER_ATTACK_RANGE,
  PLAYER_CONTACT_DAMAGE,
  PLAYER_HURT_COOLDOWN,
} from '../config/combat';
import { isEnemyActive, type EnemyState } from '../entities/enemy';
import type { PlayerState } from '../entities/player';

export interface AttackPulse {
  remaining: number;
  fromX: number;
  fromZ: number;
  toX: number;
  toZ: number;
  targetId: number;
}

export function selectNearestTarget(
  originX: number,
  originZ: number,
  range: number,
  enemies: readonly EnemyState[],
): EnemyState | null {
  const rangeSq = range * range;
  let best: EnemyState | null = null;
  let bestDistSq = Number.POSITIVE_INFINITY;

  for (const enemy of enemies) {
    if (!isEnemyActive(enemy)) {
      continue;
    }

    const distSq = distanceSq(originX, originZ, enemy.x, enemy.z);
    if (distSq > rangeSq) {
      continue;
    }

    if (
      distSq < bestDistSq ||
      (distSq === bestDistSq && best !== null && enemy.id < best.id) ||
      (distSq === bestDistSq && best === null)
    ) {
      best = enemy;
      bestDistSq = distSq;
    }
  }

  return best;
}

export function applyDamage(
  enemy: EnemyState,
  damage: number,
): { enemy: EnemyState; killed: boolean } {
  if (!isEnemyActive(enemy) || damage <= 0) {
    return { enemy, killed: false };
  }

  const health = Math.max(0, enemy.health - damage);
  if (health === 0) {
    return {
      enemy: {
        ...enemy,
        health: 0,
        lifecycle: 'dead',
        deathTimer: DEATH_DURATION,
        hitFlash: HIT_FLASH_DURATION,
      },
      killed: true,
    };
  }

  return {
    enemy: {
      ...enemy,
      health,
      hitFlash: HIT_FLASH_DURATION,
    },
    killed: false,
  };
}

export function autoAttack(
  player: PlayerState,
  enemies: readonly EnemyState[],
  deltaSeconds: number,
): {
  player: PlayerState;
  enemies: EnemyState[];
  pulse: AttackPulse | null;
  kills: number;
} {
  const attackCooldown = Math.max(0, player.attackCooldown - deltaSeconds);
  let nextPlayer: PlayerState = { ...player, attackCooldown };
  const nextEnemies = enemies.map((enemy) => ({ ...enemy }));
  let pulse: AttackPulse | null = null;
  let kills = 0;

  if (attackCooldown > 0) {
    return { player: nextPlayer, enemies: nextEnemies, pulse, kills };
  }

  const target = selectNearestTarget(player.x, player.z, PLAYER_ATTACK_RANGE, nextEnemies);
  if (target === null) {
    return { player: nextPlayer, enemies: nextEnemies, pulse, kills };
  }

  const index = nextEnemies.findIndex((enemy) => enemy.id === target.id);
  const currentTarget = index >= 0 ? nextEnemies[index] : undefined;
  if (currentTarget === undefined) {
    return { player: nextPlayer, enemies: nextEnemies, pulse, kills };
  }

  const result = applyDamage(currentTarget, PLAYER_ATTACK_DAMAGE);
  nextEnemies[index] = result.enemy;
  if (result.killed) {
    kills = 1;
  }

  nextPlayer = { ...nextPlayer, attackCooldown: PLAYER_ATTACK_COOLDOWN };
  pulse = {
    remaining: ATTACK_PULSE_DURATION,
    fromX: player.x,
    fromZ: player.z,
    toX: target.x,
    toZ: target.z,
    targetId: target.id,
  };

  return { player: nextPlayer, enemies: nextEnemies, pulse, kills };
}

export function applyContactDamage(
  player: PlayerState,
  enemies: readonly EnemyState[],
  deltaSeconds: number,
): PlayerState {
  const hurtCooldown = Math.max(0, player.hurtCooldown - deltaSeconds);
  const next: PlayerState = { ...player, hurtCooldown };

  if (hurtCooldown > 0 || player.health <= 0) {
    return next;
  }

  for (const enemy of enemies) {
    if (!isEnemyActive(enemy)) {
      continue;
    }

    const reach = player.radius + enemy.radius;
    if (distanceSq(player.x, player.z, enemy.x, enemy.z) <= reach * reach) {
      return {
        ...next,
        health: Math.max(0, player.health - PLAYER_CONTACT_DAMAGE),
        hurtCooldown: PLAYER_HURT_COOLDOWN,
      };
    }
  }

  return next;
}

export function tickEnemyPresentation(enemy: EnemyState, deltaSeconds: number): EnemyState | null {
  const hitFlash = Math.max(0, enemy.hitFlash - deltaSeconds);
  if (enemy.lifecycle === 'alive') {
    return { ...enemy, hitFlash };
  }

  const deathTimer = Math.max(0, enemy.deathTimer - deltaSeconds);
  if (deathTimer <= 0) {
    return null;
  }

  return { ...enemy, hitFlash, deathTimer };
}

export function tickAttackPulse(
  pulse: AttackPulse | null,
  deltaSeconds: number,
): AttackPulse | null {
  if (pulse === null) {
    return null;
  }

  const remaining = pulse.remaining - deltaSeconds;
  if (remaining <= 0) {
    return null;
  }

  return { ...pulse, remaining };
}

function distanceSq(ax: number, az: number, bx: number, bz: number): number {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz;
}
