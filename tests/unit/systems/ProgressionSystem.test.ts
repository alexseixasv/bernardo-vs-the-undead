import { describe, expect, it } from 'vitest';

import { MAX_ACTIVE_GEMS, XP_PER_GEM, xpRequiredForLevel } from '../../../src/config/progression';
import { createPlayerState } from '../../../src/entities/player';
import { createXpGem } from '../../../src/entities/xpGem';
import {
  aggregateGems,
  applyExperienceToPlayer,
  attractGems,
  awardExperience,
  collectGems,
  dropGemsForDeaths,
  totalGemXp,
} from '../../../src/systems/ProgressionSystem';

describe('awardExperience', () => {
  it('starts at level 1 and levels up at the first threshold', () => {
    const first = awardExperience(
      { level: 1, xp: 0, xpToNext: xpRequiredForLevel(1), pendingLevelUps: 0 },
      xpRequiredForLevel(1),
    );

    expect(first.level).toBe(2);
    expect(first.xp).toBe(0);
    expect(first.pendingLevelUps).toBe(1);
    expect(first.xpToNext).toBe(xpRequiredForLevel(2));
  });

  it('keeps leftover XP after crossing a threshold', () => {
    const next = awardExperience(
      { level: 1, xp: 18, xpToNext: xpRequiredForLevel(1), pendingLevelUps: 0 },
      15,
    );

    expect(next.level).toBe(2);
    expect(next.xp).toBe(13);
    expect(next.pendingLevelUps).toBe(1);
  });

  it('can grant several pending level-ups from one award', () => {
    const next = awardExperience(
      { level: 1, xp: 0, xpToNext: xpRequiredForLevel(1), pendingLevelUps: 0 },
      100,
    );

    expect(next.level).toBe(4);
    expect(next.xp).toBe(10);
    expect(next.pendingLevelUps).toBe(3);
    expect(next.xpToNext).toBe(xpRequiredForLevel(4));
  });

  it('ignores non-positive awards', () => {
    const start = { level: 1, xp: 4, xpToNext: xpRequiredForLevel(1), pendingLevelUps: 0 };
    expect(awardExperience(start, 0)).toEqual(start);
    expect(awardExperience(start, -8)).toEqual(start);
  });
});

describe('gem pickup', () => {
  it('awards XP once and removes the gem inside the pickup radius', () => {
    const player = createPlayerState();
    const first = collectGems(player, [createXpGem(1, 0.4, 0, XP_PER_GEM)], 1.15);

    expect(first.gainedXp).toBe(XP_PER_GEM);
    expect(first.collectedIds).toEqual([1]);
    expect(first.gems).toHaveLength(0);

    const second = collectGems(player, first.gems, 1.15);
    expect(second.gainedXp).toBe(0);
  });

  it('does not collect gems outside the pickup radius', () => {
    const player = createPlayerState();
    const result = collectGems(player, [createXpGem(1, 4, 0)], 1.15);

    expect(result.gainedXp).toBe(0);
    expect(result.gems).toHaveLength(1);
  });

  it('drops one gem per death and aggregates overflow without granting XP', () => {
    const deaths = Array.from({ length: MAX_ACTIVE_GEMS + 2 }, (_, index) => ({
      id: index + 1,
      x: index,
      z: 0,
    }));
    const result = dropGemsForDeaths([], deaths, 1, XP_PER_GEM);

    expect(result.gems).toHaveLength(MAX_ACTIVE_GEMS);
    expect(totalGemXp(result.gems)).toBe(XP_PER_GEM * (MAX_ACTIVE_GEMS + 2));
    expect(result.nextId).toBe(MAX_ACTIVE_GEMS + 3);
  });

  it('merges nearby gems while conserving XP and never duplicating ids', () => {
    const merged = aggregateGems(
      [createXpGem(1, 0, 0, 10), createXpGem(2, 0.1, 0, 10), createXpGem(3, 8, 0, 10)],
      2,
    );

    expect(merged).toHaveLength(2);
    expect(totalGemXp(merged)).toBe(30);
    expect(new Set(merged.map((gem) => gem.id)).size).toBe(2);
  });

  it('moves gems toward Bernardo inside the attract radius but not inside pickup', () => {
    const player = createPlayerState();
    const pulled = attractGems(player, [createXpGem(1, 2.2, 0, XP_PER_GEM)], 1.15, 0.1);
    expect(pulled[0]?.x).toBeLessThan(2.2);
    expect(pulled[0]?.x).toBeGreaterThan(1.15);

    const far = attractGems(player, [createXpGem(1, 8, 0, XP_PER_GEM)], 1.15, 0.1);
    expect(far[0]?.x).toBe(8);
  });
});

describe('applyExperienceToPlayer', () => {
  it('writes integer XP and pending choices onto the player', () => {
    const player = applyExperienceToPlayer(createPlayerState(), 20);
    expect(player.level).toBe(2);
    expect(player.xp).toBe(0);
    expect(player.pendingLevelUps).toBe(1);
  });
});
