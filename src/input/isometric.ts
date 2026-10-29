import { ISOMETRIC_SCREEN_RIGHT, ISOMETRIC_SCREEN_UP } from '../config/world';
import type { InputIntent } from './InputIntent';

export interface WorldMovement {
  x: number;
  z: number;
}

export function screenIntentToWorld(intent: InputIntent): WorldMovement {
  return {
    x: intent.axisX * ISOMETRIC_SCREEN_RIGHT.x + intent.axisY * ISOMETRIC_SCREEN_UP.x,
    z: intent.axisX * ISOMETRIC_SCREEN_RIGHT.z + intent.axisY * ISOMETRIC_SCREEN_UP.z,
  };
}
