import { describe, expect, it } from 'vitest';

import { PLAYER_CONTACT_DAMAGE, PLAYER_MAX_HEALTH } from '../../../src/config/combat';
import { PLAYER_MOVE_SPEED } from '../../../src/config/world';
import { createSkeletonWarrior } from '../../../src/entities/enemy';
import { createPlayerState } from '../../../src/entities/player';
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
    expect(world.getEnemies()).toHaveLength(0);
    expect(world.getKills()).toBe(0);
    expect(world.getElapsedSeconds()).toBe(0);
  });
});
