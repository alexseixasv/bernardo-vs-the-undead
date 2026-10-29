import { describe, expect, it } from 'vitest';

import { ARENA_HALF_EXTENT } from '../../../src/config/world';
import { createSkeletonWarrior } from '../../../src/entities/enemy';
import { createPlayerState } from '../../../src/entities/player';
import { pursuePlayer } from '../../../src/systems/PursuitSystem';

describe('pursuePlayer', () => {
  it('moves the skeleton toward Bernardo', () => {
    const enemy = createSkeletonWarrior(1, 0, 0);
    const player = { ...createPlayerState(), x: 8, z: 0 };
    const next = pursuePlayer(enemy, player, 0.5);

    expect(next.x).toBeGreaterThan(enemy.x);
    expect(next.z).toBeCloseTo(0);
    expect(next.facingYaw).toBeCloseTo(Math.atan2(8, 0));
  });

  it('does not produce invalid coordinates at zero distance', () => {
    const player = createPlayerState();
    const enemy = createSkeletonWarrior(1, player.x, player.z);
    const next = pursuePlayer(enemy, player, 1);

    expect(Number.isFinite(next.x)).toBe(true);
    expect(Number.isFinite(next.z)).toBe(true);
    expect(next.x).toBe(player.x);
    expect(next.z).toBe(player.z);
  });

  it('stops at contact distance instead of overlapping endlessly', () => {
    const player = createPlayerState();
    const enemy = createSkeletonWarrior(1, player.radius + 0.42, 0);
    const next = pursuePlayer(enemy, player, 1);

    expect(Math.hypot(next.x - player.x, next.z - player.z)).toBeGreaterThanOrEqual(
      player.radius + next.radius - 1e-6,
    );
  });

  it('stays inside the arena while chasing', () => {
    const player = { ...createPlayerState(), x: ARENA_HALF_EXTENT, z: ARENA_HALF_EXTENT };
    const enemy = createSkeletonWarrior(1, ARENA_HALF_EXTENT - 0.5, ARENA_HALF_EXTENT - 0.5);
    const next = pursuePlayer(enemy, player, 1);

    expect(Math.abs(next.x)).toBeLessThanOrEqual(ARENA_HALF_EXTENT);
    expect(Math.abs(next.z)).toBeLessThanOrEqual(ARENA_HALF_EXTENT);
  });
});
