import { MAX_ACTIVE_GEMS, xpRequiredForLevel } from '../config/progression';
import type { PlayerState } from '../entities/player';
import { createXpGem, type XpGem } from '../entities/xpGem';

export interface ExperienceState {
  level: number;
  xp: number;
  xpToNext: number;
  pendingLevelUps: number;
}

export interface CombatDeath {
  id: number;
  x: number;
  z: number;
}

export function awardExperience(state: ExperienceState, amount: number): ExperienceState {
  if (amount <= 0) {
    return { ...state };
  }

  let { level, pendingLevelUps } = state;
  let xp = state.xp + Math.floor(amount);

  let xpToNext = xpRequiredForLevel(level);
  while (xp >= xpToNext) {
    xp -= xpToNext;
    level += 1;
    pendingLevelUps += 1;
    xpToNext = xpRequiredForLevel(level);
  }

  return { level, xp, xpToNext, pendingLevelUps };
}

export function applyExperienceToPlayer(player: PlayerState, amount: number): PlayerState {
  const next = awardExperience(
    {
      level: player.level,
      xp: player.xp,
      xpToNext: player.xpToNext,
      pendingLevelUps: player.pendingLevelUps,
    },
    amount,
  );

  return {
    ...player,
    level: next.level,
    xp: next.xp,
    xpToNext: next.xpToNext,
    pendingLevelUps: next.pendingLevelUps,
  };
}

export function dropGemsForDeaths(
  gems: readonly XpGem[],
  deaths: readonly CombatDeath[],
  nextId: number,
  xpPerGem: number,
): { gems: XpGem[]; nextId: number; overflowXp: number } {
  const nextGems = gems.map((gem) => ({ ...gem }));
  let id = nextId;
  let overflowXp = 0;

  for (const death of deaths) {
    nextGems.push(createXpGem(id, death.x, death.z, xpPerGem));
    id += 1;
  }

  while (nextGems.length > MAX_ACTIVE_GEMS) {
    const oldest = nextGems.shift();
    if (oldest !== undefined) {
      overflowXp += oldest.xp;
    }
  }

  return { gems: nextGems, nextId: id, overflowXp };
}

export function collectGems(
  player: PlayerState,
  gems: readonly XpGem[],
  pickupRadius: number,
): { gems: XpGem[]; gainedXp: number; collectedIds: number[] } {
  const radiusSq = pickupRadius * pickupRadius;
  const remaining: XpGem[] = [];
  const collectedIds: number[] = [];
  let gainedXp = 0;

  for (const gem of gems) {
    const dx = gem.x - player.x;
    const dz = gem.z - player.z;
    if (dx * dx + dz * dz <= radiusSq) {
      gainedXp += gem.xp;
      collectedIds.push(gem.id);
      continue;
    }

    remaining.push({ ...gem });
  }

  return { gems: remaining, gainedXp, collectedIds };
}
