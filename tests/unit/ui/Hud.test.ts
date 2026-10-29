import { describe, expect, it } from 'vitest';

import { formatRunTime, upgradeIndexFromCode } from '../../../src/ui/Hud';

describe('formatRunTime', () => {
  it('formats elapsed simulation time as m:ss', () => {
    expect(formatRunTime(0)).toBe('0:00');
    expect(formatRunTime(9.9)).toBe('0:09');
    expect(formatRunTime(75)).toBe('1:15');
  });
});

describe('upgradeIndexFromCode', () => {
  it('maps number keys 1-3 to offer indexes', () => {
    expect(upgradeIndexFromCode('Digit1')).toBe(0);
    expect(upgradeIndexFromCode('Digit2')).toBe(1);
    expect(upgradeIndexFromCode('Digit3')).toBe(2);
    expect(upgradeIndexFromCode('KeyW')).toBeNull();
  });
});
