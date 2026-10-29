import { PLAYER_MAX_HEALTH } from '../config/combat';
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
  };
}

export function clonePlayerState(player: PlayerState): PlayerState {
  return { ...player };
}
