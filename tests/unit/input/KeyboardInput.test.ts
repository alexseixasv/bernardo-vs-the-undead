import { describe, expect, it } from 'vitest';

import {
  createKeyboardState,
  intentFromKeyboardState,
  reduceKeyboardState,
  shouldPreventBrowserScroll,
} from '../../../src/input/keyboardState';

describe('keyboardState', () => {
  it('builds a normalized intent from WASD and arrow keys', () => {
    let state = createKeyboardState();
    state = reduceKeyboardState(state, { type: 'keydown', code: 'KeyW' });
    state = reduceKeyboardState(state, { type: 'keydown', code: 'KeyD' });

    const diagonal = intentFromKeyboardState(state);
    expect(Math.hypot(diagonal.axisX, diagonal.axisY)).toBeCloseTo(1);
    expect(diagonal.axisX).toBeGreaterThan(0);
    expect(diagonal.axisY).toBeGreaterThan(0);

    state = reduceKeyboardState(state, { type: 'keyup', code: 'KeyW' });
    state = reduceKeyboardState(state, { type: 'keyup', code: 'KeyD' });
    state = reduceKeyboardState(state, { type: 'keydown', code: 'ArrowLeft' });

    expect(intentFromKeyboardState(state)).toEqual({ axisX: -1, axisY: 0 });
  });

  it('marks arrow keys as browser-scroll preventers', () => {
    expect(shouldPreventBrowserScroll('ArrowDown')).toBe(true);
    expect(shouldPreventBrowserScroll('KeyS')).toBe(false);
  });

  it('clears movement when focus is lost', () => {
    let state = reduceKeyboardState(createKeyboardState(), { type: 'keydown', code: 'KeyW' });
    expect(intentFromKeyboardState(state).axisY).toBe(1);

    state = reduceKeyboardState(state, { type: 'blur' });
    expect(intentFromKeyboardState(state)).toEqual({ axisX: 0, axisY: 0 });

    state = reduceKeyboardState(state, { type: 'keydown', code: 'KeyW' });
    expect(intentFromKeyboardState(state)).toEqual({ axisX: 0, axisY: 0 });
  });

  it('does not keep held keys after returning from a hidden tab', () => {
    let state = reduceKeyboardState(createKeyboardState(), { type: 'keydown', code: 'KeyA' });
    state = reduceKeyboardState(state, { type: 'hide' });
    state = reduceKeyboardState(state, { type: 'show' });

    expect(intentFromKeyboardState(state)).toEqual({ axisX: 0, axisY: 0 });
  });
});
