import { XP_PER_GEM } from '../config/progression';

export interface XpGem {
  id: number;
  x: number;
  z: number;
  xp: number;
}

export function createXpGem(id: number, x: number, z: number, xp: number = XP_PER_GEM): XpGem {
  return { id, x, z, xp };
}

export function cloneXpGem(gem: XpGem): XpGem {
  return { ...gem };
}
