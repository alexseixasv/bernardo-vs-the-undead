import {
  cloneAbilityLoadout,
  createAbilityLoadout,
  type AbilityLoadout,
} from '../config/abilities';
import { PLAYER_MAX_HEALTH } from '../config/combat';
import { STARTING_LEVEL, xpRequiredForLevel } from '../config/progression';
import { PLAYER_RADIUS } from '../config/world';

export interface PlayerState {
  x: number;
  y: number;
  z: number;
  facingYaw: number;
  radius: number;
  health: number;
  maxHealth: number;
  attackCooldown: number;
  hurtCooldown: number;
  swordCooldown: number;
  level: number;
  xp: number;
  xpToNext: number;
  pendingLevelUps: number;
  abilities: AbilityLoadout;
}

export function createPlayerState(): PlayerState {
  return {
    x: 0,
    y: 0,
    z: 0,
    facingYaw: 0,
    radius: PLAYER_RADIUS,
    health: PLAYER_MAX_HEALTH,
    maxHealth: PLAYER_MAX_HEALTH,
    attackCooldown: 0,
    hurtCooldown: 0,
    swordCooldown: 0,
    level: STARTING_LEVEL,
    xp: 0,
    xpToNext: xpRequiredForLevel(STARTING_LEVEL),
    pendingLevelUps: 0,
    abilities: createAbilityLoadout(),
  };
}

export function clonePlayerState(player: PlayerState): PlayerState {
  return {
    ...player,
    abilities: cloneAbilityLoadout(player.abilities),
  };
}
