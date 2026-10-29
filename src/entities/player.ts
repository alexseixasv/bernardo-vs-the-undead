import { PLAYER_RADIUS } from '../config/world';

export interface PlayerState {
  x: number;
  y: number;
  z: number;
  facingYaw: number;
  radius: number;
}

export function createPlayerState(): PlayerState {
  return {
    x: 0,
    y: 0,
    z: 0,
    facingYaw: 0,
    radius: PLAYER_RADIUS,
  };
}

export function clonePlayerState(player: PlayerState): PlayerState {
  return {
    x: player.x,
    y: player.y,
    z: player.z,
    facingYaw: player.facingYaw,
    radius: player.radius,
  };
}
