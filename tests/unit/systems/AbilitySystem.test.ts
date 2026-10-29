import { describe, expect, it } from 'vitest';

import {
  MAGIC_PULSE_LEVELS,
  SWIFT_BOOTS_LEVELS,
  VITALITY_LEVELS,
  abilityMaxLevel,
  createAbilityLoadout,
  deriveCombatStats,
} from '../../../src/config/abilities';
import { PLAYER_MAX_HEALTH } from '../../../src/config/combat';
import { BASE_PICKUP_RADIUS } from '../../../src/config/progression';
import { PLAYER_MOVE_SPEED } from '../../../src/config/world';
import { createPlayerState } from '../../../src/entities/player';
import { sequenceRandom } from '../../../src/math/random';
import {
  applyUpgrade,
  eligibleAbilityIds,
  generateUpgradeOffers,
  isAbilityEligible,
} from '../../../src/systems/AbilitySystem';

describe('upgrade eligibility', () => {
  it('treats Magic Pulse as already unlocked and Lightning Sword as locked', () => {
    const loadout = createAbilityLoadout();
    expect(loadout.magicPulse).toBe(1);
    expect(loadout.lightningSword).toBe(0);
    expect(isAbilityEligible(loadout, 'magicPulse')).toBe(true);
    expect(isAbilityEligible(loadout, 'lightningSword')).toBe(true);
  });

  it('never offers a maxed upgrade', () => {
    const loadout = createAbilityLoadout();
    loadout.magicPulse = abilityMaxLevel('magicPulse');
    expect(isAbilityEligible(loadout, 'magicPulse')).toBe(false);
    expect(eligibleAbilityIds(loadout)).not.toContain('magicPulse');
  });

  it('returns three distinct offers when the pool is large enough', () => {
    const offers = generateUpgradeOffers(createAbilityLoadout(), sequenceRandom([0.1, 0.8, 0.3]));
    expect(offers).toHaveLength(3);
    expect(new Set(offers.map((offer) => offer.id)).size).toBe(3);
  });

  it('returns fewer than three offers when the pool is smaller', () => {
    const loadout = createAbilityLoadout();
    loadout.magicPulse = abilityMaxLevel('magicPulse');
    loadout.lightningSword = abilityMaxLevel('lightningSword');
    loadout.swiftBoots = abilityMaxLevel('swiftBoots');
    const offers = generateUpgradeOffers(loadout, sequenceRandom([0]));
    expect(offers).toHaveLength(2);
  });

  it('returns no offers when every upgrade is maxed', () => {
    const loadout = createAbilityLoadout();
    loadout.magicPulse = abilityMaxLevel('magicPulse');
    loadout.lightningSword = abilityMaxLevel('lightningSword');
    loadout.swiftBoots = abilityMaxLevel('swiftBoots');
    loadout.vitality = abilityMaxLevel('vitality');
    loadout.magnet = abilityMaxLevel('magnet');
    expect(generateUpgradeOffers(loadout, sequenceRandom([0]))).toEqual([]);
  });
});

describe('applyUpgrade', () => {
  it('upgrades Magic Pulse damage, range, and cooldown', () => {
    const player = applyUpgrade(createPlayerState(), 'magicPulse');
    const stats = deriveCombatStats(player.abilities);
    const level2 = MAGIC_PULSE_LEVELS[1];
    expect(player.abilities.magicPulse).toBe(2);
    expect(stats.pulseDamage).toBe(level2?.damage);
    expect(stats.pulseRange).toBe(level2?.range);
    expect(stats.pulseCooldown).toBe(level2?.cooldown);
  });

  it('unlocks Lightning Sword at level 1', () => {
    const player = applyUpgrade(createPlayerState(), 'lightningSword');
    const stats = deriveCombatStats(player.abilities);
    expect(player.abilities.lightningSword).toBe(1);
    expect(stats.swordUnlocked).toBe(true);
    expect(stats.swordDamage).toBeGreaterThan(0);
  });

  it('raises movement speed with Swift Boots', () => {
    const player = applyUpgrade(createPlayerState(), 'swiftBoots');
    expect(deriveCombatStats(player.abilities).moveSpeed).toBe(SWIFT_BOOTS_LEVELS[0]?.moveSpeed);
    expect(deriveCombatStats(player.abilities).moveSpeed).toBeGreaterThan(PLAYER_MOVE_SPEED);
  });

  it('raises max HP and restores vitality without resetting current health', () => {
    const wounded = { ...createPlayerState(), health: 40 };
    const player = applyUpgrade(wounded, 'vitality');
    const level1 = VITALITY_LEVELS[0];
    expect(player.maxHealth).toBe(level1?.maxHealth);
    expect(player.health).toBe(40 + (level1?.restore ?? 0));
    expect(player.health).toBeLessThanOrEqual(player.maxHealth);
    expect(player.health).not.toBe(PLAYER_MAX_HEALTH);
  });

  it('clamps current HP to the new maximum', () => {
    const full = applyUpgrade(createPlayerState(), 'vitality');
    expect(full.health).toBe(full.maxHealth);
    expect(full.health).toBeGreaterThan(PLAYER_MAX_HEALTH);
  });

  it('increases the XP pickup radius with Magnet', () => {
    const player = applyUpgrade(createPlayerState(), 'magnet');
    expect(deriveCombatStats(player.abilities).pickupRadius).toBeGreaterThan(BASE_PICKUP_RADIUS);
  });

  it('rejects upgrades that are already maxed', () => {
    let player = createPlayerState();
    player = {
      ...player,
      abilities: { ...player.abilities, magicPulse: abilityMaxLevel('magicPulse') },
    };
    const next = applyUpgrade(player, 'magicPulse');
    expect(next.abilities.magicPulse).toBe(abilityMaxLevel('magicPulse'));
  });
});
