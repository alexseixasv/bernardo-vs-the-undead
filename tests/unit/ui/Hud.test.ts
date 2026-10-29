import { describe, expect, it } from 'vitest';

import { formatRunTime } from '../../../src/ui/Hud';

describe('formatRunTime', () => {
  it('formats elapsed simulation time as m:ss', () => {
    expect(formatRunTime(0)).toBe('0:00');
    expect(formatRunTime(9.9)).toBe('0:09');
    expect(formatRunTime(75)).toBe('1:15');
  });
});
