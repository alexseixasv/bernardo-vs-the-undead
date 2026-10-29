import { describe, expect, it } from 'vitest';

import { PLAYER_CONTACT_DAMAGE, PLAYER_MAX_HEALTH } from '../../../src/config/combat';
import { XP_PER_GEM, xpRequiredForLevel } from '../../../src/config/progression';
import { PLAYER_MOVE_SPEED } from '../../../src/config/world';
import { createSkeletonWarrior } from '../../../src/entities/enemy';
import { createPlayerState } from '../../../src/entities/player';
import { createXpGem } from '../../../src/entities/xpGem';
import { IDLE_INTENT, createInputIntent } from '../../../src/input/InputIntent';
import { FIXED_TIMESTEP_SECONDS } from '../../../src/core/GameLoop';
import { World } from '../../../src/world/World';

describe('World', () => {
  it('interpolates between previous and current simulation states', () => {
    const world = new World();
    world.step(1, createInputIntent(1, 0));

    const start = world.getSnapshot(0);
    const mid = world.getSnapshot(0.5);
    const end = world.getSnapshot(1);

    expect(Math.hypot(end.player.x, end.player.z)).toBeCloseTo(PLAYER_MOVE_SPEED);
    expect(mid.player.x).toBeCloseTo((start.player.x + end.player.x) / 2);
    expect(mid.player.z).toBeCloseTo((start.player.z + end.player.z) / 2);
  });

  it('enters game over when health reaches zero and reset restores a clean run', () => {
    const world = new World({
      player: { ...createPlayerState(), health: PLAYER_CONTACT_DAMAGE },
      enemies: [createSkeletonWarrior(1, 0.2, 0)],
    });

    world.step(FIXED_TIMESTEP_SECONDS, IDLE_INTENT);

    expect(world.getStatus()).toBe('gameOver');
    expect(world.getPlayer().health).toBe(0);

    world.step(1, createInputIntent(1, 0));
    expect(world.getPlayer().x).toBe(0);

    world.reset();
    expect(world.getStatus()).toBe('playing');
    expect(world.getPlayer().health).toBe(PLAYER_MAX_HEALTH);
    expect(world.getPlayer().level).toBe(1);
    expect(world.getPlayer().xp).toBe(0);
    expect(world.getPlayer().abilities.lightningSword).toBe(0);
    expect(world.getEnemies()).toHaveLength(0);
    expect(world.getGems()).toHaveLength(0);
    expect(world.getOffers()).toHaveLength(0);
    expect(world.getKills()).toBe(0);
    expect(world.getElapsedSeconds()).toBe(0);
  });

  it('drops one gem when a skeleton dies and collects it inside pickup range', () => {
    const world = new World({
      player: { ...createPlayerState(), attackCooldown: 0 },
      enemies: [{ ...createSkeletonWarrior(1, 2, 0), health: 1, maxHealth: 1 }],
    });

    world.step(FIXED_TIMESTEP_SECONDS, IDLE_INTENT);

    expect(world.getKills()).toBe(1);
    const gems = world.getGems();
    expect(gems).toHaveLength(1);
    expect(gems[0]?.xp).toBe(XP_PER_GEM);
  });

  it('pauses simulation during level-up and resumes after one upgrade', () => {
    const world = new World({
      gems: [createXpGem(1, 0, 0, xpRequiredForLevel(1))],
    });

    world.step(FIXED_TIMESTEP_SECONDS, IDLE_INTENT);
    expect(world.getStatus()).toBe('levelUp');
    expect(world.getOffers()).toHaveLength(3);
    const pausedAt = world.getElapsedSeconds();
    const pausedX = world.getPlayer().x;

    world.step(1, createInputIntent(1, 0));
    expect(world.getElapsedSeconds()).toBe(pausedAt);
    expect(world.getPlayer().x).toBe(pausedX);
    expect(world.chooseUpgrade(99)).toBe(false);

    expect(world.chooseUpgrade(0)).toBe(true);
    expect(world.getStatus()).toBe('playing');
    expect(world.getPlayer().pendingLevelUps).toBe(0);
    expect(world.chooseUpgrade(0)).toBe(false);

    world.step(FIXED_TIMESTEP_SECONDS, createInputIntent(1, 0));
    expect(world.getPlayer().x).not.toBe(pausedX);
  });

  it('processes pending level-ups one overlay at a time', () => {
    const world = new World({
      gems: [createXpGem(1, 0, 0, 100)],
    });

    world.step(FIXED_TIMESTEP_SECONDS, IDLE_INTENT);
    expect(world.getStatus()).toBe('levelUp');
    expect(world.getPlayer().pendingLevelUps).toBeGreaterThan(1);

    expect(world.chooseUpgrade(0)).toBe(true);
    expect(world.getStatus()).toBe('levelUp');
    expect(world.getPlayer().pendingLevelUps).toBeGreaterThan(0);

    while (world.getStatus() === 'levelUp') {
      expect(world.chooseUpgrade(0)).toBe(true);
    }

    expect(world.getStatus()).toBe('playing');
    expect(world.getPlayer().pendingLevelUps).toBe(0);
  });

  it('resets progression, abilities, gems, and cooldowns on restart', () => {
    const world = new World({
      gems: [createXpGem(1, 0, 0, xpRequiredForLevel(1))],
      player: {
        ...createPlayerState(),
        attackCooldown: 0.4,
        swordCooldown: 0.3,
      },
    });

    world.step(FIXED_TIMESTEP_SECONDS, IDLE_INTENT);
    world.chooseUpgrade(0);
    world.reset();

    const player = world.getPlayer();
    expect(player.level).toBe(1);
    expect(player.xp).toBe(0);
    expect(player.abilities.magicPulse).toBe(1);
    expect(player.abilities.lightningSword).toBe(0);
    expect(player.attackCooldown).toBe(0);
    expect(player.swordCooldown).toBe(0);
    expect(world.getGems()).toHaveLength(0);
    expect(world.getOffers()).toHaveLength(0);
    expect(world.getStatus()).toBe('playing');
  });
});
