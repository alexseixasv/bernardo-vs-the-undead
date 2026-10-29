import {
  ABILITY_DEFINITIONS,
  ABILITY_IDS,
  LIGHTNING_SWORD_LEVELS,
  MAGIC_PULSE_LEVELS,
  MAGNET_LEVELS,
  SWIFT_BOOTS_LEVELS,
  VITALITY_LEVELS,
  abilityMaxLevel,
  deriveCombatStats,
  vitalityRestoreForLevel,
  type AbilityId,
  type AbilityLoadout,
} from '../config/abilities';
import type { PlayerState } from '../entities/player';
import type { RandomFn } from '../math/random';

export const UPGRADE_OFFER_COUNT = 3;

export interface UpgradeOffer {
  id: AbilityId;
  name: string;
  description: string;
  accent: string;
  currentLevel: number;
  nextLevel: number;
  result: string;
}

export function isAbilityEligible(loadout: AbilityLoadout, id: AbilityId): boolean {
  return loadout[id] < abilityMaxLevel(id);
}

export function eligibleAbilityIds(loadout: AbilityLoadout): AbilityId[] {
  return ABILITY_IDS.filter((id) => isAbilityEligible(loadout, id));
}

export function generateUpgradeOffers(
  loadout: AbilityLoadout,
  random: RandomFn,
  count: number = UPGRADE_OFFER_COUNT,
): UpgradeOffer[] {
  const eligible = eligibleAbilityIds(loadout);
  const picked = pickDistinct(eligible, count, random);
  return picked.map((id) => describeUpgrade(loadout, id));
}

export function describeUpgrade(loadout: AbilityLoadout, id: AbilityId): UpgradeOffer {
  const definition = ABILITY_DEFINITIONS[id];
  const currentLevel = loadout[id];
  const nextLevel = currentLevel + 1;

  return {
    id,
    name: definition.name,
    description: definition.description,
    accent: definition.accent,
    currentLevel,
    nextLevel,
    result: describeUpgradeResult(id, currentLevel, nextLevel),
  };
}

export function applyUpgrade(player: PlayerState, id: AbilityId): PlayerState {
  if (!isAbilityEligible(player.abilities, id)) {
    return player;
  }

  const nextLevel = player.abilities[id] + 1;
  const abilities: AbilityLoadout = {
    ...player.abilities,
    [id]: nextLevel,
  };
  const stats = deriveCombatStats(abilities);
  const restored = id === 'vitality' ? vitalityRestoreForLevel(nextLevel) : 0;
  const health = Math.min(stats.maxHealth, player.health + restored);

  return {
    ...player,
    abilities,
    maxHealth: stats.maxHealth,
    health,
  };
}

export function describeUpgradeResult(
  id: AbilityId,
  currentLevel: number,
  nextLevel: number,
): string {
  switch (id) {
    case 'magicPulse': {
      const from = MAGIC_PULSE_LEVELS[Math.max(0, currentLevel - 1)];
      const to = MAGIC_PULSE_LEVELS[nextLevel - 1];
      if (from === undefined || to === undefined) {
        return `Upgrade Magic Pulse to level ${nextLevel}.`;
      }
      return `Damage ${from.damage} → ${to.damage}. Range ${formatNumber(from.range)} → ${formatNumber(to.range)}. Cooldown ${formatNumber(from.cooldown)}s → ${formatNumber(to.cooldown)}s.`;
    }
    case 'lightningSword': {
      const to = LIGHTNING_SWORD_LEVELS[nextLevel - 1];
      if (to === undefined) {
        return `Upgrade Lightning Sword to level ${nextLevel}.`;
      }
      if (currentLevel === 0) {
        return `Unlock. Damage ${to.damage}, range ${formatNumber(to.range)}, ${to.arcDegrees}° arc, ${formatNumber(to.cooldown)}s cooldown.`;
      }
      const from = LIGHTNING_SWORD_LEVELS[currentLevel - 1];
      if (from === undefined) {
        return `Upgrade Lightning Sword to level ${nextLevel}.`;
      }
      return `Damage ${from.damage} → ${to.damage}. Range ${formatNumber(from.range)} → ${formatNumber(to.range)}. Arc ${from.arcDegrees}° → ${to.arcDegrees}°. Cooldown ${formatNumber(from.cooldown)}s → ${formatNumber(to.cooldown)}s.`;
    }
    case 'swiftBoots': {
      const to = SWIFT_BOOTS_LEVELS[nextLevel - 1];
      if (to === undefined) {
        return `Upgrade Swift Boots to level ${nextLevel}.`;
      }
      if (currentLevel === 0) {
        return `Move speed becomes ${formatNumber(to.moveSpeed)}.`;
      }
      const from = SWIFT_BOOTS_LEVELS[currentLevel - 1];
      if (from === undefined) {
        return `Move speed becomes ${formatNumber(to.moveSpeed)}.`;
      }
      return `Move speed ${formatNumber(from.moveSpeed)} → ${formatNumber(to.moveSpeed)}.`;
    }
    case 'vitality': {
      const to = VITALITY_LEVELS[nextLevel - 1];
      if (to === undefined) {
        return `Upgrade Vitality to level ${nextLevel}.`;
      }
      return `Max HP becomes ${to.maxHealth} and restore ${to.restore} HP.`;
    }
    case 'magnet': {
      const to = MAGNET_LEVELS[nextLevel - 1];
      if (to === undefined) {
        return `Upgrade Magnet to level ${nextLevel}.`;
      }
      return `Pickup radius becomes ${formatNumber(to.pickupRadius)}.`;
    }
    default:
      return `Upgrade to level ${nextLevel}.`;
  }
}

export function pickDistinct<T>(items: readonly T[], count: number, random: RandomFn): T[] {
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const current = pool[i];
    const swap = pool[j];
    if (current === undefined || swap === undefined) {
      continue;
    }
    pool[i] = swap;
    pool[j] = current;
  }

  return pool.slice(0, Math.min(count, pool.length));
}

function formatNumber(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}
