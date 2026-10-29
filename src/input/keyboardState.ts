import { createInputIntent, IDLE_INTENT, type InputIntent } from './InputIntent';

export const MOVEMENT_CODES = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'ArrowUp',
  'ArrowLeft',
  'ArrowDown',
  'ArrowRight',
]);

export const PREVENT_SCROLL_CODES = new Set(['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']);

export interface KeyboardState {
  pressed: ReadonlySet<string>;
  focused: boolean;
}

export type KeyboardInputEvent =
  | { type: 'keydown'; code: string }
  | { type: 'keyup'; code: string }
  | { type: 'blur' }
  | { type: 'focus' }
  | { type: 'hide' }
  | { type: 'show' };

export function createKeyboardState(): KeyboardState {
  return {
    pressed: new Set<string>(),
    focused: true,
  };
}

export function shouldPreventBrowserScroll(code: string): boolean {
  return PREVENT_SCROLL_CODES.has(code);
}

export function reduceKeyboardState(
  state: KeyboardState,
  event: KeyboardInputEvent,
): KeyboardState {
  switch (event.type) {
    case 'keydown': {
      if (!state.focused || !MOVEMENT_CODES.has(event.code)) {
        return state;
      }
      const pressed = new Set(state.pressed);
      pressed.add(event.code);
      return { focused: true, pressed };
    }
    case 'keyup': {
      const pressed = new Set(state.pressed);
      pressed.delete(event.code);
      return { focused: state.focused, pressed };
    }
    case 'blur':
    case 'hide':
      return { focused: false, pressed: new Set() };
    case 'focus':
    case 'show':
      return { focused: true, pressed: new Set() };
    default:
      return state;
  }
}

export function intentFromKeyboardState(state: KeyboardState): InputIntent {
  if (!state.focused) {
    return IDLE_INTENT;
  }

  let axisX = 0;
  let axisY = 0;

  if (state.pressed.has('KeyD') || state.pressed.has('ArrowRight')) {
    axisX += 1;
  }
  if (state.pressed.has('KeyA') || state.pressed.has('ArrowLeft')) {
    axisX -= 1;
  }
  if (state.pressed.has('KeyW') || state.pressed.has('ArrowUp')) {
    axisY += 1;
  }
  if (state.pressed.has('KeyS') || state.pressed.has('ArrowDown')) {
    axisY -= 1;
  }

  return createInputIntent(axisX, axisY);
}
