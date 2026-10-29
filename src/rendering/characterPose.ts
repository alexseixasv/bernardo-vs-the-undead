export type BernardoAnim = 'idle' | 'walk' | 'hurt' | 'defeat';
export type SkeletonAnim = 'idle' | 'walk' | 'contact' | 'hit' | 'death';

export interface BernardoPoseInput {
  moving: boolean;
  hurtAmount: number;
  defeated: boolean;
}

export interface SkeletonPoseInput {
  moving: boolean;
  contacting: boolean;
  hitAmount: number;
  lifecycle: 'alive' | 'dead';
}

export function selectBernardoAnim(input: BernardoPoseInput): BernardoAnim {
  if (input.defeated) {
    return 'defeat';
  }
  if (input.hurtAmount > 0.15) {
    return 'hurt';
  }
  if (input.moving) {
    return 'walk';
  }
  return 'idle';
}

export function selectSkeletonAnim(input: SkeletonPoseInput): SkeletonAnim {
  if (input.lifecycle === 'dead') {
    return 'death';
  }
  if (input.hitAmount > 0.2) {
    return 'hit';
  }
  if (input.contacting) {
    return 'contact';
  }
  if (input.moving) {
    return 'walk';
  }
  return 'idle';
}

export const MOVEMENT_EPSILON = 1e-4;
