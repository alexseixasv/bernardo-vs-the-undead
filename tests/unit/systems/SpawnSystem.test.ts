import { describe, expect, it } from 'vitest';

import { MAX_ACTIVE_SKELETONS, SPAWN_SAFETY_RADIUS } from '../../../src/config/combat';
import { ARENA_HALF_EXTENT } from '../../../src/config/world';
import { createPlayerState } from '../../../src/entities/player';
import { sequenceRandom } from '../../../src/math/random';
import {
  countActiveEnemies,
  createSpawnState,
  pickSpawnPosition,
  trySpawnSkeleton,
} from '../../../src/systems/SpawnSystem';

describe('pickSpawnPosition', () => {
  it('keeps spawns outside the player safety radius when space allows', () => {
    const player = createPlayerState();
    const position = pickSpawnPosition(player, () => 0);

    expect(Math.hypot(position.x - player.x, position.z - player.z)).toBeGreaterThanOrEqual(
      SPAWN_SAFETY_RADIUS - 1e-6,
    );
  });

  it('clamps spawn points to the arena', () => {
    const player = { ...createPlayerState(), x: ARENA_HALF_EXTENT, z: ARENA_HALF_EXTENT };
    const position = pickSpawnPosition(player, () => 0.99);

    expect(Math.abs(position.x)).toBeLessThanOrEqual(ARENA_HALF_EXTENT);
    expect(Math.abs(position.z)).toBeLessThanOrEqual(ARENA_HALF_EXTENT);
  });
});

describe('trySpawnSkeleton', () => {
  it('does not spawn on the first tick before the initial delay elapses', () => {
    const result = trySpawnSkeleton(
      createSpawnState(),
      createPlayerState(),
      [],
      0,
      0.5,
      sequenceRandom([0.5, 0.5]),
    );

    expect(result.enemy).toBeNull();
  });

  it('enforces the maximum active enemy count', () => {
    let spawn = createSpawnState();
    spawn = { ...spawn, cooldown: 0 };
    const player = createPlayerState();
    const enemies = [];

    for (let index = 0; index < MAX_ACTIVE_SKELETONS; index += 1) {
      const result = trySpawnSkeleton(spawn, player, enemies, 8, 0.05, () => 0.4);
      expect(result.enemy).not.toBeNull();
      if (result.enemy) {
        enemies.push(result.enemy);
      }
      spawn = { ...result.spawn, cooldown: 0 };
    }

    const blocked = trySpawnSkeleton(spawn, player, enemies, 12, 0.05, () => 0.4);
    expect(blocked.enemy).toBeNull();
    expect(countActiveEnemies(enemies)).toBe(MAX_ACTIVE_SKELETONS);
  });
});
