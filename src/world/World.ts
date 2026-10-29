import { clonePlayerState, createPlayerState, type PlayerState } from '../entities/player';
import type { InputIntent } from '../input/InputIntent';
import { movePlayer } from '../systems/MovementSystem';

export interface PlayerSnapshot {
  x: number;
  y: number;
  z: number;
  facingYaw: number;
}

export class World {
  private previous: PlayerState;
  private current: PlayerState;

  constructor(player: PlayerState = createPlayerState()) {
    this.current = clonePlayerState(player);
    this.previous = clonePlayerState(player);
  }

  step(deltaSeconds: number, intent: InputIntent): void {
    this.previous = clonePlayerState(this.current);
    this.current = movePlayer(this.current, intent, deltaSeconds);
  }

  getPlayer(): PlayerState {
    return clonePlayerState(this.current);
  }

  getSnapshot(interpolationAlpha: number): PlayerSnapshot {
    const alpha = Math.min(1, Math.max(0, interpolationAlpha));
    return {
      x: lerp(this.previous.x, this.current.x, alpha),
      y: lerp(this.previous.y, this.current.y, alpha),
      z: lerp(this.previous.z, this.current.z, alpha),
      facingYaw: this.current.facingYaw,
    };
  }
}

function lerp(from: number, to: number, alpha: number): number {
  return from + (to - from) * alpha;
}
