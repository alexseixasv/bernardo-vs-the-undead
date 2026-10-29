import { describe, expect, it } from 'vitest';

import { AudioSystem, type AudioContextLike } from '../../../src/audio/AudioSystem';
import { detectSfx } from '../../../src/audio/detectSfx';
import { createPlayerState } from '../../../src/entities/player';
import type { WorldSnapshot } from '../../../src/world/World';

function emptySnapshot(overrides: Partial<WorldSnapshot> = {}): WorldSnapshot {
  const player = createPlayerState();
  return {
    player: {
      x: 0,
      y: 0,
      z: 0,
      facingYaw: 0,
      health: player.health,
      maxHealth: player.maxHealth,
      hurtAmount: 0,
      moving: false,
      radius: player.radius,
      level: player.level,
      xp: player.xp,
      xpToNext: player.xpToNext,
      pendingLevelUps: 0,
    },
    enemies: [],
    gems: [],
    pulse: null,
    slash: null,
    offers: [],
    status: 'playing',
    kills: 0,
    elapsedSeconds: 0,
    ...overrides,
  };
}

function fakeContext(): AudioContextLike {
  return {
    currentTime: 0,
    destination: {},
    state: 'running',
    createOscillator() {
      return {
        type: 'sine',
        frequency: { value: 0 },
        connect() {
          return this;
        },
        start() {},
        stop() {},
      };
    },
    createGain() {
      return {
        gain: {
          value: 1,
          setValueAtTime() {},
          linearRampToValueAtTime() {},
          exponentialRampToValueAtTime() {},
        },
        connect() {
          return this;
        },
      };
    },
    async resume() {},
    async close() {},
  };
}

describe('AudioSystem', () => {
  it('does not play before unlock and does not throw', () => {
    const audio = new AudioSystem(() => fakeContext());
    expect(() => audio.play('pulse')).not.toThrow();
    expect(audio.isUnlocked()).toBe(false);
  });

  it('stays silent while muted after unlock', async () => {
    const audio = new AudioSystem(() => fakeContext());
    await audio.unlock();
    audio.setMuted(true);
    expect(audio.isMuted()).toBe(true);
    expect(() => audio.play('gem')).not.toThrow();
    audio.dispose();
  });
});

describe('detectSfx', () => {
  it('emits pulse, gem, hurt, and game-over cues from snapshot deltas', () => {
    const previous = emptySnapshot();
    const next = emptySnapshot({
      pulse: { remaining: 0.2, fromX: 0, fromZ: 0, toX: 1, toZ: 0, targetId: 1 },
      kills: 1,
      player: {
        ...emptySnapshot().player,
        health: 88,
        xp: 10,
      },
      status: 'gameOver',
    });

    expect(detectSfx(null, next)).toEqual([]);
    expect(detectSfx(previous, next)).toEqual(['pulse', 'hit', 'gem', 'hurt', 'gameOver']);
  });
});
