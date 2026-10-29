import {
  GEM_ATTRACT_MULTIPLIER,
  GEM_ATTRACT_SPEED,
  MAX_ACTIVE_GEMS,
  xpRequiredForLevel,
} from '../config/progression';
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

export function totalGemXp(gems: readonly XpGem[]): number {
  let total = 0;
  for (const gem of gems) {
    total += gem.xp;
  }
  return total;
}

export function dropGemsForDeaths(
  gems: readonly XpGem[],
  deaths: readonly CombatDeath[],
  nextId: number,
  xpPerGem: number,
  maxActive: number = MAX_ACTIVE_GEMS,
): { gems: XpGem[]; nextId: number } {
  const nextGems = gems.map((gem) => ({ ...gem }));
  let id = nextId;

  for (const death of deaths) {
    nextGems.push(createXpGem(id, death.x, death.z, xpPerGem));
    id += 1;
  }

  return { gems: aggregateGems(nextGems, maxActive), nextId: id };
}

export function aggregateGems(
  gems: readonly XpGem[],
  maxActive: number = MAX_ACTIVE_GEMS,
): XpGem[] {
  const next = gems.map((gem) => ({ ...gem }));
  while (next.length > maxActive) {
    const pair = findClosestPair(next);
    if (pair === null) {
      break;
    }

    const [firstIndex, secondIndex] = pair;
    const first = next[firstIndex];
    const second = next[secondIndex];
    if (first === undefined || second === undefined) {
      break;
    }

    const kept: XpGem = {
      id: Math.min(first.id, second.id),
      x: (first.x + second.x) / 2,
      z: (first.z + second.z) / 2,
      xp: first.xp + second.xp,
    };

    const higher = Math.max(firstIndex, secondIndex);
    const lower = Math.min(firstIndex, secondIndex);
    next.splice(higher, 1);
    next.splice(lower, 1);
    next.push(kept);
  }

  return next;
}

export function attractGems(
  player: PlayerState,
  gems: readonly XpGem[],
  pickupRadius: number,
  deltaSeconds: number,
  attractMultiplier: number = GEM_ATTRACT_MULTIPLIER,
  attractSpeed: number = GEM_ATTRACT_SPEED,
): XpGem[] {
  const attractRadius = pickupRadius * attractMultiplier;
  const attracted: XpGem[] = [];

  for (const gem of gems) {
    const dx = player.x - gem.x;
    const dz = player.z - gem.z;
    const distance = Math.hypot(dx, dz);
    if (distance <= pickupRadius || distance > attractRadius || distance < 1e-8) {
      attracted.push({ ...gem });
      continue;
    }

    const travel = Math.min(attractSpeed * deltaSeconds, distance - pickupRadius * 0.85);
    const step = travel / distance;
    attracted.push({
      ...gem,
      x: gem.x + dx * step,
      z: gem.z + dz * step,
    });
  }

  return attracted;
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

function findClosestPair(gems: readonly XpGem[]): [number, number] | null {
  if (gems.length < 2) {
    return null;
  }

  let bestI = 0;
  let bestJ = 1;
  let best = Number.POSITIVE_INFINITY;

  for (let i = 0; i < gems.length; i += 1) {
    const a = gems[i];
    if (a === undefined) {
      continue;
    }
    for (let j = i + 1; j < gems.length; j += 1) {
      const b = gems[j];
      if (b === undefined) {
        continue;
      }
      const dist = (a.x - b.x) * (a.x - b.x) + (a.z - b.z) * (a.z - b.z);
      if (dist < best) {
        best = dist;
        bestI = i;
        bestJ = j;
      }
    }
  }

  return [bestI, bestJ];
}
