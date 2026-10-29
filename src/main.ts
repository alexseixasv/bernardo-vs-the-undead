import { Game } from './core/Game';
import { WebGLInitError } from './rendering/webgl';
import './style.css';

function showBootError(message: string): void {
  const canvas = document.getElementById('game-canvas');
  if (canvas instanceof HTMLCanvasElement) {
    canvas.hidden = true;
  }

  const hint = document.getElementById('controls-hint');
  if (hint) {
    hint.hidden = true;
  }

  const hud = document.getElementById('hud');
  if (hud) {
    hud.hidden = true;
  }

  const errorElement = document.getElementById('boot-error');
  if (!(errorElement instanceof HTMLElement)) {
    return;
  }

  errorElement.hidden = false;
  errorElement.textContent = message;
}

function boot(): void {
  const canvas = document.getElementById('game-canvas');
  if (!(canvas instanceof HTMLCanvasElement)) {
    showBootError('The game canvas is missing from the page.');
    return;
  }

  try {
    const game = new Game(canvas);
    game.start();

    window.addEventListener(
      'pagehide',
      () => {
        game.dispose();
      },
      { once: true },
    );
  } catch (error) {
    const message =
      error instanceof WebGLInitError
        ? error.message
        : 'The game failed to start. Please reload the page or try another browser.';
    showBootError(message);
    console.error(error);
  }
}

boot();
