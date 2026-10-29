import type { SkeletonAnim } from './characterPose';

export interface SkeletonPartPose {
  rootScale: number;
  bodyY: number;
  bodyRotX: number;
  bodyRotZ: number;
  leftArmRotX: number;
  leftArmRotZ: number;
  rightArmRotX: number;
  rightArmRotZ: number;
  leftLegRotX: number;
  rightLegRotX: number;
}

export const SKELETON_HEAD_LOCAL = { x: 0, y: 1.34, z: 0 } as const;
export const SKELETON_LEFT_ARM_LOCAL = { x: -0.26, y: 1.06, z: 0 } as const;
export const SKELETON_RIGHT_ARM_LOCAL = { x: 0.26, y: 1.06, z: 0 } as const;
export const SKELETON_LEFT_LEG_LOCAL = { x: -0.1, y: 0.58, z: 0 } as const;
export const SKELETON_RIGHT_LEG_LOCAL = { x: 0.1, y: 0.58, z: 0 } as const;
export const SKELETON_LEFT_SOCKET_LOCAL = { x: -0.07, y: 0.04, z: 0.16 } as const;
export const SKELETON_RIGHT_SOCKET_LOCAL = { x: 0.07, y: 0.04, z: 0.16 } as const;

export function computeSkeletonPartPose(
  anim: SkeletonAnim,
  phase: number,
  hitAmount: number,
  deathAmount: number,
  phaseOffset: number,
): SkeletonPartPose {
  const pose: SkeletonPartPose = {
    rootScale: 1,
    bodyY: 0,
    bodyRotX: 0,
    bodyRotZ: 0,
    leftArmRotX: 0,
    leftArmRotZ: 0.15,
    rightArmRotX: 0,
    rightArmRotZ: -0.15,
    leftLegRotX: 0,
    rightLegRotX: 0,
  };

  if (anim === 'death') {
    const amount = Math.min(1, deathAmount);
    pose.bodyRotX = amount * 1.35;
    pose.bodyY = -amount * 0.2;
    pose.rootScale = Math.max(0.08, 1 - amount * 0.35);
    return pose;
  }

  if (anim === 'hit') {
    pose.rootScale = 1 + hitAmount * 0.2;
    pose.bodyRotZ = Math.sin((phase + phaseOffset) * 40) * 0.18 * hitAmount;
    return pose;
  }

  const time = phase * 8 + phaseOffset;
  if (anim === 'contact') {
    pose.rightArmRotX = -0.9 + Math.sin(time * 1.6) * 0.25;
    pose.leftArmRotX = 0.2;
    return pose;
  }

  if (anim === 'walk') {
    const swing = Math.sin(time) * 0.6;
    pose.leftArmRotX = swing;
    pose.rightArmRotX = -swing;
    pose.leftLegRotX = -swing;
    pose.rightLegRotX = swing;
    pose.bodyY = Math.abs(Math.sin(time)) * 0.04;
    return pose;
  }

  const idle = Math.sin(phase * 2 + phaseOffset) * 0.03;
  pose.bodyY = idle;
  pose.leftArmRotZ = 0.18 + idle;
  pose.rightArmRotZ = -0.18 - idle;
  return pose;
}

export function skeletonHitTint(hitAmount: number): { r: number; g: number; b: number } {
  const t = Math.min(1, Math.max(0, hitAmount));
  return {
    r: 1,
    g: 1 - t * 0.45,
    b: 1 - t * 0.55,
  };
}
