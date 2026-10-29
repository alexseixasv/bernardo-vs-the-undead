import { describe, expect, it } from 'vitest';

import {
  PLAYER_ATTACK_COOLDOWN,
  PLAYER_ATTACK_DAMAGE,
  PLAYER_ATTACK_RANGE,
  PLAYER_CONTACT_DAMAGE,
  PLAYER_HURT_COOLDOWN,
  PLAYER_MAX_HEALTH,
  SKELETON_MAX_HEALTH,
} from '../../../src/config/combat';
import { createSkeletonWarrior } from '../../../src/entities/enemy';
import { createPlayerState } from '../../../src/entities/player';
import { applyUpgrade } from '../../../src/systems/AbilitySystem';
import {
  applyContactDamage,
  applyDamage,
  autoAttack,
  isInsideSwordArc,
  lightningSwordAttack,
  selectNearestTarget,
} from '../../../src/systems/CombatSystem';

describe('selectNearestTarget', () => {
  it('selects the nearest living enemy in range', () => {
    const near = createSkeletonWarrior(2, 1, 0);
    const far = createSkeletonWarrior(1, 2, 0);
    const target = selectNearestTarget(0, 0, PLAYER_ATTACK_RANGE, [far, near]);

    expect(target?.id).toBe(2);
  });

  it('breaks distance ties with the lower id', () => {
    const left = createSkeletonWarrior(8, 1, 0);
    const right = createSkeletonWarrior(3, 1, 0);
    const target = selectNearestTarget(0, 0, PLAYER_ATTACK_RANGE, [left, right]);

    expect(target?.id).toBe(3);
  });

  it('ignores dead enemies and anything outside range', () => {
    const dead = { ...createSkeletonWarrior(1, 0.5, 0), lifecycle: 'dead' as const, health: 0 };
    const outside = createSkeletonWarrior(2, PLAYER_ATTACK_RANGE + 1, 0);

    expect(selectNearestTarget(0, 0, PLAYER_ATTACK_RANGE, [dead, outside])).toBeNull();
    expect(selectNearestTarget(0, 0, PLAYER_ATTACK_RANGE, [])).toBeNull();
  });
});

describe('applyDamage', () => {
  it('reduces health and kills at zero', () => {
    const enemy = createSkeletonWarrior(1, 0, 0);
    const wounded = applyDamage(enemy, PLAYER_ATTACK_DAMAGE);

    expect(wounded.killed).toBe(false);
    expect(wounded.enemy.health).toBe(SKELETON_MAX_HEALTH - PLAYER_ATTACK_DAMAGE);

    const killed = applyDamage(wounded.enemy, SKELETON_MAX_HEALTH);
    expect(killed.killed).toBe(true);
    expect(killed.enemy.lifecycle).toBe('dead');
    expect(killed.enemy.health).toBe(0);
  });
});

describe('autoAttack', () => {
  it('attacks after the cooldown and does not fire while cooling down', () => {
    const player = { ...createPlayerState(), attackCooldown: 0 };
    const enemy = createSkeletonWarrior(1, 1, 0);

    const first = autoAttack(player, [enemy], 0);
    expect(first.pulse?.targetId).toBe(1);
    expect(first.enemies[0]?.health).toBe(SKELETON_MAX_HEALTH - PLAYER_ATTACK_DAMAGE);
    expect(first.player.attackCooldown).toBe(PLAYER_ATTACK_COOLDOWN);

    const second = autoAttack(first.player, first.enemies, 0.1);
    expect(second.pulse).toBeNull();
    expect(second.enemies[0]?.health).toBe(first.enemies[0]?.health);
  });
});

describe('lightningSwordAttack', () => {
  it('hits enemies in a forward arc and ignores enemies behind Bernardo', () => {
    const player = {
      ...applyUpgrade(createPlayerState(), 'lightningSword'),
      facingYaw: 0,
      swordCooldown: 0,
    };
    const ahead = createSkeletonWarrior(1, 0, 1.2);
    const behind = createSkeletonWarrior(2, 0, -1.2);

    expect(isInsideSwordArc(0, 0, 0, 2.4, (80 * Math.PI) / 180, 0, 1.2)).toBe(true);
    expect(isInsideSwordArc(0, 0, 0, 2.4, (80 * Math.PI) / 180, 0, -1.2)).toBe(false);

    const result = lightningSwordAttack(player, [ahead, behind], 0);
    expect(result.slash).not.toBeNull();
    expect(result.enemies[0]?.health).toBeLessThan(SKELETON_MAX_HEALTH);
    expect(result.enemies[1]?.health).toBe(SKELETON_MAX_HEALTH);
  });

  it('keeps an independent cooldown from Magic Pulse', () => {
    const player = {
      ...applyUpgrade(createPlayerState(), 'lightningSword'),
      facingYaw: 0,
      attackCooldown: 0,
      swordCooldown: 0,
    };
    const pulseTarget = createSkeletonWarrior(1, 1.2, 0);
    const swordTarget = createSkeletonWarrior(2, 0, 1.2);

    const pulse = autoAttack(player, [pulseTarget, swordTarget], 0);
    const sword = lightningSwordAttack(pulse.player, pulse.enemies, 0);

    expect(pulse.pulse).not.toBeNull();
    expect(sword.slash).not.toBeNull();
    expect(pulse.player.attackCooldown).toBeGreaterThan(0);
    expect(sword.player.swordCooldown).toBeGreaterThan(0);
    expect(pulse.player.swordCooldown).toBe(0);
  });

  it('does not count a second kill on an enemy already slain this step', () => {
    const player = {
      ...applyUpgrade(createPlayerState(), 'lightningSword'),
      facingYaw: 0,
      attackCooldown: 0,
      swordCooldown: 0,
    };
    const enemy = { ...createSkeletonWarrior(1, 0, 1), health: 1, maxHealth: 1 };

    const pulse = autoAttack(player, [enemy], 0);
    const sword = lightningSwordAttack(pulse.player, pulse.enemies, 0);

    expect(pulse.kills).toBe(1);
    expect(sword.kills).toBe(0);
    expect(pulse.deaths).toHaveLength(1);
    expect(sword.deaths).toHaveLength(0);
  });
});

describe('applyContactDamage', () => {
  it('damages Bernardo once and then waits for the invulnerability window', () => {
    const player = createPlayerState();
    const enemy = createSkeletonWarrior(1, 0.2, 0);

    const hit = applyContactDamage(player, [enemy], 0);
    expect(hit.health).toBe(PLAYER_MAX_HEALTH - PLAYER_CONTACT_DAMAGE);
    expect(hit.hurtCooldown).toBe(PLAYER_HURT_COOLDOWN);

    const blocked = applyContactDamage(hit, [enemy], 0.1);
    expect(blocked.health).toBe(hit.health);
    expect(blocked.hurtCooldown).toBeCloseTo(PLAYER_HURT_COOLDOWN - 0.1);
  });
});
