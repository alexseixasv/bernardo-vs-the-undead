import { IDLE_INTENT, type InputIntent } from './InputIntent';
import {
  createKeyboardState,
  intentFromKeyboardState,
  type KeyboardState,
  reduceKeyboardState,
  shouldPreventBrowserScroll,
} from './keyboardState';

export interface KeyboardInputOptions {
  eventTarget?: EventTarget;
  documentTarget?: EventTarget;
}

export class KeyboardInput {
  private readonly eventTarget: EventTarget;
  private readonly documentTarget: EventTarget;
  private state: KeyboardState = createKeyboardState();
  private disposed = false;

  private readonly onKeyDown = (event: Event): void => {
    if (this.disposed) {
      return;
    }

    const code = getEventCode(event);
    if (code === null) {
      return;
    }

    if (shouldPreventBrowserScroll(code)) {
      event.preventDefault();
    }

    this.state = reduceKeyboardState(this.state, { type: 'keydown', code });
  };

  private readonly onKeyUp = (event: Event): void => {
    if (this.disposed) {
      return;
    }

    const code = getEventCode(event);
    if (code === null) {
      return;
    }

    this.state = reduceKeyboardState(this.state, { type: 'keyup', code });
  };

  private readonly onBlur = (): void => {
    this.state = reduceKeyboardState(this.state, { type: 'blur' });
  };

  private readonly onFocus = (): void => {
    this.state = reduceKeyboardState(this.state, { type: 'focus' });
  };

  private readonly onVisibilityChange = (): void => {
    const hidden =
      this.documentTarget instanceof Document
        ? this.documentTarget.visibilityState === 'hidden'
        : false;
    this.state = reduceKeyboardState(this.state, { type: hidden ? 'hide' : 'show' });
  };

  constructor(options: KeyboardInputOptions = {}) {
    this.eventTarget = options.eventTarget ?? window;
    this.documentTarget = options.documentTarget ?? document;

    this.eventTarget.addEventListener('keydown', this.onKeyDown);
    this.eventTarget.addEventListener('keyup', this.onKeyUp);
    this.eventTarget.addEventListener('blur', this.onBlur);
    this.eventTarget.addEventListener('focus', this.onFocus);
    this.documentTarget.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  getIntent(): InputIntent {
    if (this.disposed) {
      return IDLE_INTENT;
    }

    return intentFromKeyboardState(this.state);
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.state = { focused: false, pressed: new Set() };

    this.eventTarget.removeEventListener('keydown', this.onKeyDown);
    this.eventTarget.removeEventListener('keyup', this.onKeyUp);
    this.eventTarget.removeEventListener('blur', this.onBlur);
    this.eventTarget.removeEventListener('focus', this.onFocus);
    this.documentTarget.removeEventListener('visibilitychange', this.onVisibilityChange);
  }
}

function getEventCode(event: Event): string | null {
  if (!('code' in event) || typeof event.code !== 'string') {
    return null;
  }

  return event.code;
}
