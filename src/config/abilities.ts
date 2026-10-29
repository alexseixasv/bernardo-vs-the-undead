import {
  PLAYER_ATTACK_COOLDOWN,
  PLAYER_ATTACK_DAMAGE,
  PLAYER_ATTACK_RANGE,
  PLAYER_MAX_HEALTH,
} from './combat';
import { BASE_PICKUP_RADIUS } from './progression';
import { PLAYER_MOVE_SPEED } from './world';

export const ABILITY_IDS = [
  'magicPulse',
  'lightningSword',
  'swiftBoots',
  'vitality',
  'magnet',
] as const;

export type AbilityId = (typeof ABILITY_IDS)[number];

export interface MagicPulseLevel {
  damage: number;
  range: number;
  cooldown: number;
}

export interface LightningSwordLevel {
  damage: number;
  range: number;
  arcDegrees: number;
  cooldown: number;
}

export interface SwiftBootsLevel {
  moveSpeed: number;
}

export interface VitalityLevel {
  maxHealth: number;
  restore: number;
}

export interface MagnetLevel {
  pickupRadius: number;
}

export const MAGIC_PULSE_LEVELS: readonly MagicPulseLevel[] = [
  { damage: PLAYER_ATTACK_DAMAGE, range: PLAYER_ATTACK_RANGE, cooldown: PLAYER_ATTACK_COOLDOWN },
  { damage: 16, range: 3.1, cooldown: 0.6 },
  { damage: 20, range: 3.4, cooldown: 0.55 },
  { damage: 24, range: 3.7, cooldown: 0.5 },
  { damage: 28, range: 4.0, cooldown: 0.45 },
];

export const LIGHTNING_SWORD_LEVELS: readonly LightningSwordLevel[] = [
  { damage: 10, range: 2.4, arcDegrees: 80, cooldown: 0.85 },
  { damage: 14, range: 2.7, arcDegrees: 90, cooldown: 0.75 },
  { damage: 18, range: 3.0, arcDegrees: 100, cooldown: 0.65 },
  { damage: 22, range: 3.3, arcDegrees: 110, cooldown: 0.55 },
];

export const SWIFT_BOOTS_LEVELS: readonly SwiftBootsLevel[] = [
  { moveSpeed: PLAYER_MOVE_SPEED + 1.2 },
  { moveSpeed: PLAYER_MOVE_SPEED + 2.2 },
  { moveSpeed: PLAYER_MOVE_SPEED + 3.2 },
];

export const VITALITY_LEVELS: readonly VitalityLevel[] = [
  { maxHealth: PLAYER_MAX_HEALTH + 20, restore: 20 },
  { maxHealth: PLAYER_MAX_HEALTH + 40, restore: 25 },
  { maxHealth: PLAYER_MAX_HEALTH + 65, restore: 30 },
  { maxHealth: PLAYER_MAX_HEALTH + 95, restore: 40 },
];

export const MAGNET_LEVELS: readonly MagnetLevel[] = [
  { pickupRadius: 2.1 },
  { pickupRadius: 3.2 },
  { pickupRadius: 4.6 },
];

export interface AbilityDefinition {
  id: AbilityId;
  name: string;
  description: string;
  accent: string;
  maxLevel: number;
  unlockedByDefault: boolean;
}

export const ABILITY_DEFINITIONS: Record<AbilityId, AbilityDefinition> = {
  magicPulse: {
    id: 'magicPulse',
    name: 'Magic Pulse',
    description: 'Bernardo’s starting automatic burst of nearby magic.',
    accent: '#ffe14a',
    maxLevel: MAGIC_PULSE_LEVELS.length,
    unlockedByDefault: true,
  },
  lightningSword: {
    id: 'lightningSword',
    name: 'Lightning Sword',
    description: 'An automatic lightning slash in the direction Bernardo faces.',
    accent: '#5ce1ff',
    maxLevel: LIGHTNING_SWORD_LEVELS.length,
    unlockedByDefault: false,
  },
  swiftBoots: {
    id: 'swiftBoots',
    name: 'Swift Boots',
    description: 'Run faster while kiting the horde.',
    accent: '#7dff9a',
    maxLevel: SWIFT_BOOTS_LEVELS.length,
    unlockedByDefault: false,
  },
  vitality: {
    id: 'vitality',
    name: 'Vitality',
    description: 'Raise maximum health and recover a burst of HP.',
    accent: '#ff6b8a',
    maxLevel: VITALITY_LEVELS.length,
    unlockedByDefault: false,
  },
  magnet: {
    id: 'magnet',
    name: 'Magnet',
    description: 'Collect experience crystals from farther away.',
    accent: '#6aa8ff',
    maxLevel: MAGNET_LEVELS.length,
    unlockedByDefault: false,
  },
};

export interface AbilityLoadout {
  magicPulse: number;
  lightningSword: number;
  swiftBoots: number;
  vitality: number;
  magnet: number;
}

export function createAbilityLoadout(): AbilityLoadout {
  return {
    magicPulse: 1,
    lightningSword: 0,
    swiftBoots: 0,
    vitality: 0,
    magnet: 0,
  };
}

export function cloneAbilityLoadout(loadout: AbilityLoadout): AbilityLoadout {
  return { ...loadout };
}

export function abilityMaxLevel(id: AbilityId): number {
  return ABILITY_DEFINITIONS[id].maxLevel;
}

export interface DerivedCombatStats {
  moveSpeed: number;
  maxHealth: number;
  pickupRadius: number;
  pulseDamage: number;
  pulseRange: number;
  pulseCooldown: number;
  swordUnlocked: boolean;
  swordDamage: number;
  swordRange: number;
  swordArcRadians: number;
  swordCooldownDuration: number;
}

export function deriveCombatStats(loadout: AbilityLoadout): DerivedCombatStats {
  const pulse = MAGIC_PULSE_LEVELS[Math.max(0, loadout.magicPulse - 1)] ?? MAGIC_PULSE_LEVELS[0];
  const sword =
    loadout.lightningSword > 0
      ? (LIGHTNING_SWORD_LEVELS[loadout.lightningSword - 1] ?? LIGHTNING_SWORD_LEVELS[0])
      : undefined;
  const boots = loadout.swiftBoots > 0 ? SWIFT_BOOTS_LEVELS[loadout.swiftBoots - 1] : undefined;
  const vitality = loadout.vitality > 0 ? VITALITY_LEVELS[loadout.vitality - 1] : undefined;
  const magnet = loadout.magnet > 0 ? MAGNET_LEVELS[loadout.magnet - 1] : undefined;

  return {
    moveSpeed: boots?.moveSpeed ?? PLAYER_MOVE_SPEED,
    maxHealth: vitality?.maxHealth ?? PLAYER_MAX_HEALTH,
    pickupRadius: magnet?.pickupRadius ?? BASE_PICKUP_RADIUS,
    pulseDamage: pulse?.damage ?? PLAYER_ATTACK_DAMAGE,
    pulseRange: pulse?.range ?? PLAYER_ATTACK_RANGE,
    pulseCooldown: pulse?.cooldown ?? PLAYER_ATTACK_COOLDOWN,
    swordUnlocked: loadout.lightningSword > 0,
    swordDamage: sword?.damage ?? 0,
    swordRange: sword?.range ?? 0,
    swordArcRadians: ((sword?.arcDegrees ?? 0) * Math.PI) / 180,
    swordCooldownDuration: sword?.cooldown ?? 0,
  };
}

export function vitalityRestoreForLevel(level: number): number {
  if (level <= 0) {
    return 0;
  }

  return VITALITY_LEVELS[level - 1]?.restore ?? 0;
}
