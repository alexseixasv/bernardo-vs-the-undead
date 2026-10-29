export const XP_PER_GEM = 10;
export const XP_BASE_TO_LEVEL = 20;
export const XP_GROWTH_PER_LEVEL = 10;
export const STARTING_LEVEL = 1;

export const BASE_PICKUP_RADIUS = 1.15;
export const GEM_ATTRACT_MULTIPLIER = 2.5;
export const GEM_ATTRACT_SPEED = 10;
export const MAX_ACTIVE_GEMS = 40;

export const SWORD_SLASH_DURATION = 0.22;

export function xpRequiredForLevel(level: number): number {
  const safeLevel = Math.max(STARTING_LEVEL, Math.floor(level));
  return XP_BASE_TO_LEVEL + (safeLevel - STARTING_LEVEL) * XP_GROWTH_PER_LEVEL;
}
