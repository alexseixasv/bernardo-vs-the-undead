import { describe, expect, it } from 'vitest';

import { ARENA_HALF_EXTENT, PLAYER_MOVE_SPEED, PLAYER_RADIUS } from '../../../src/config/world';
import { createPlayerState } from '../../../src/entities/player';
import { createInputIntent } from '../../../src/input/InputIntent';
import { clampToArena, movePlayer } from '../../../src/systems/MovementSystem';

const CONFIG = {
  speed: PLAYER_MOVE_SPEED,
  arenaHalfExtent: ARENA_HALF_EXTENT,
};

describe('movePlayer', () => {
  it('moves at the configured speed along screen up', () => {
    const player = movePlayer(createPlayerState(), createInputIntent(0, 1), 1, CONFIG);

    expect(Math.hypot(player.x, player.z)).toBeCloseTo(PLAYER_MOVE_SPEED);
    expect(player.x).toBeCloseTo(-PLAYER_MOVE_SPEED * Math.SQRT1_2);
    expect(player.z).toBeCloseTo(-PLAYER_MOVE_SPEED * Math.SQRT1_2);
  });

  it('uses elapsed time so movement is frame-rate independent', () => {
    const half = movePlayer(createPlayerState(), createInputIntent(1, 0), 0.5, CONFIG);
    const full = movePlayer(createPlayerState(), createInputIntent(1, 0), 1, CONFIG);

    expect(Math.hypot(half.x, half.z)).toBeCloseTo(PLAYER_MOVE_SPEED * 0.5);
    expect(Math.hypot(full.x, full.z)).toBeCloseTo(PLAYER_MOVE_SPEED);
  });

  it('does not boost diagonal speed', () => {
    const diagonal = movePlayer(createPlayerState(), createInputIntent(1, 1), 1, CONFIG);

    expect(Math.hypot(diagonal.x, diagonal.z)).toBeCloseTo(PLAYER_MOVE_SPEED);
  });

  it('keeps facing when there is no movement', () => {
    const started = createPlayerState();
    started.facingYaw = 1.2;

    const idle = movePlayer(started, createInputIntent(0, 0), 1, CONFIG);

    expect(idle.x).toBe(0);
    expect(idle.z).toBe(0);
    expect(idle.facingYaw).toBe(1.2);
  });

  it('faces the world movement direction', () => {
    const player = movePlayer(createPlayerState(), createInputIntent(1, 0), 1, CONFIG);

    expect(player.facingYaw).toBeCloseTo(Math.atan2(player.x, player.z));
  });

  it('does not depend on rendering objects', () => {
    const player = movePlayer(createPlayerState(), createInputIntent(0, -1), 0.25, CONFIG);

    expect(player.y).toBe(0);
    expect(player.radius).toBe(PLAYER_RADIUS);
    expect(player.health).toBe(player.maxHealth);
  });
});

describe('clampToArena', () => {
  it('keeps the player inside the playable radius', () => {
    const limit = ARENA_HALF_EXTENT - PLAYER_RADIUS;
    const clamped = clampToArena(
      {
        ...createPlayerState(),
        x: 100,
        z: -80,
      },
      ARENA_HALF_EXTENT,
    );

    expect(clamped.x).toBeCloseTo(limit);
    expect(clamped.z).toBeCloseTo(-limit);
  });

  it('stops movement at the boundary instead of leaving the arena', () => {
    const againstEdge = {
      ...createPlayerState(),
      x: ARENA_HALF_EXTENT - PLAYER_RADIUS,
    };

    const next = movePlayer(againstEdge, createInputIntent(1, 0), 1, CONFIG);

    expect(next.x).toBeCloseTo(ARENA_HALF_EXTENT - PLAYER_RADIUS);
    expect(Math.abs(next.x)).toBeLessThanOrEqual(ARENA_HALF_EXTENT - PLAYER_RADIUS + 1e-10);
    expect(Math.abs(next.z)).toBeLessThanOrEqual(ARENA_HALF_EXTENT - PLAYER_RADIUS + 1e-10);
  });
});
