import { deriveCombatStats } from '../config/abilities';
import {
  ATTACK_PULSE_DURATION,
  DEATH_DURATION,
  HIT_FLASH_DURATION,
  PLAYER_CONTACT_DAMAGE,
  PLAYER_HURT_COOLDOWN,
} from '../config/combat';
import { SWORD_SLASH_DURATION } from '../config/progression';
import { isEnemyActive, type EnemyState } from '../entities/enemy';
import type { PlayerState } from '../entities/player';
import type { CombatDeath } from './ProgressionSystem';

export interface AttackPulse {
  remaining: number;
  fromX: number;
  fromZ: number;
  toX: number;
  toZ: number;
  targetId: number;
}

export interface SwordSlash {
  remaining: number;
  x: number;
  z: number;
  yaw: number;
  range: number;
}

const ZERO_DISTANCE = 1e-8;

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

export function isInsideSwordArc(
  originX: number,
  originZ: number,
  facingYaw: number,
  range: number,
  arcRadians: number,
  enemyX: number,
  enemyZ: number,
): boolean {
  const dx = enemyX - originX;
  const dz = enemyZ - originZ;
  const distance = Math.hypot(dx, dz);
  if (distance > range) {
    return false;
  }
  if (distance < ZERO_DISTANCE) {
    return true;
  }

  const angle = Math.atan2(dx, dz);
  const delta = wrapAngle(angle - facingYaw);
  return Math.abs(delta) <= arcRadians / 2;
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
  deaths: CombatDeath[];
  kills: number;
} {
  const stats = deriveCombatStats(player.abilities);
  const attackCooldown = Math.max(0, player.attackCooldown - deltaSeconds);
  let nextPlayer: PlayerState = { ...player, attackCooldown };
  const nextEnemies = enemies.map((enemy) => ({ ...enemy }));
  let pulse: AttackPulse | null = null;
  const deaths: CombatDeath[] = [];

  if (attackCooldown > 0) {
    return { player: nextPlayer, enemies: nextEnemies, pulse, deaths, kills: 0 };
  }

  const target = selectNearestTarget(player.x, player.z, stats.pulseRange, nextEnemies);
  if (target === null) {
    return { player: nextPlayer, enemies: nextEnemies, pulse, deaths, kills: 0 };
  }

  const index = nextEnemies.findIndex((enemy) => enemy.id === target.id);
  const currentTarget = index >= 0 ? nextEnemies[index] : undefined;
  if (currentTarget === undefined) {
    return { player: nextPlayer, enemies: nextEnemies, pulse, deaths, kills: 0 };
  }

  const result = applyDamage(currentTarget, stats.pulseDamage);
  nextEnemies[index] = result.enemy;
  if (result.killed) {
    deaths.push({ id: result.enemy.id, x: result.enemy.x, z: result.enemy.z });
  }

  nextPlayer = { ...nextPlayer, attackCooldown: stats.pulseCooldown };
  pulse = {
    remaining: ATTACK_PULSE_DURATION,
    fromX: player.x,
    fromZ: player.z,
    toX: target.x,
    toZ: target.z,
    targetId: target.id,
  };

  return { player: nextPlayer, enemies: nextEnemies, pulse, deaths, kills: deaths.length };
}

export function lightningSwordAttack(
  player: PlayerState,
  enemies: readonly EnemyState[],
  deltaSeconds: number,
): {
  player: PlayerState;
  enemies: EnemyState[];
  slash: SwordSlash | null;
  deaths: CombatDeath[];
  kills: number;
} {
  const stats = deriveCombatStats(player.abilities);
  const swordCooldown = Math.max(0, player.swordCooldown - deltaSeconds);
  let nextPlayer: PlayerState = { ...player, swordCooldown };
  const nextEnemies = enemies.map((enemy) => ({ ...enemy }));
  const deaths: CombatDeath[] = [];

  if (!stats.swordUnlocked || swordCooldown > 0) {
    return { player: nextPlayer, enemies: nextEnemies, slash: null, deaths, kills: 0 };
  }

  let hit = false;
  for (let index = 0; index < nextEnemies.length; index += 1) {
    const enemy = nextEnemies[index];
    if (enemy === undefined || !isEnemyActive(enemy)) {
      continue;
    }
    if (
      !isInsideSwordArc(
        player.x,
        player.z,
        player.facingYaw,
        stats.swordRange,
        stats.swordArcRadians,
        enemy.x,
        enemy.z,
      )
    ) {
      continue;
    }

    hit = true;
    const result = applyDamage(enemy, stats.swordDamage);
    nextEnemies[index] = result.enemy;
    if (result.killed) {
      deaths.push({ id: result.enemy.id, x: result.enemy.x, z: result.enemy.z });
    }
  }

  if (!hit) {
    return { player: nextPlayer, enemies: nextEnemies, slash: null, deaths, kills: 0 };
  }

  nextPlayer = { ...nextPlayer, swordCooldown: stats.swordCooldownDuration };
  const slash: SwordSlash = {
    remaining: SWORD_SLASH_DURATION,
    x: player.x,
    z: player.z,
    yaw: player.facingYaw,
    range: stats.swordRange,
  };

  return { player: nextPlayer, enemies: nextEnemies, slash, deaths, kills: deaths.length };
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

export function tickSwordSlash(slash: SwordSlash | null, deltaSeconds: number): SwordSlash | null {
  if (slash === null) {
    return null;
  }

  const remaining = slash.remaining - deltaSeconds;
  if (remaining <= 0) {
    return null;
  }

  return { ...slash, remaining };
}

function wrapAngle(radians: number): number {
  let value = radians;
  while (value > Math.PI) {
    value -= Math.PI * 2;
  }
  while (value < -Math.PI) {
    value += Math.PI * 2;
  }
  return value;
}

function distanceSq(ax: number, az: number, bx: number, bz: number): number {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz;
}
