import { SRGBColorSpace, WebGLRenderer } from 'three';

import { type BootstrapScene, createBootstrapScene } from './createBootstrapScene';
import { isWebGL2Available, WebGLInitError } from './webgl';

export class GameRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: WebGLRenderer;
  private readonly bootstrap: BootstrapScene;
  private readonly handleResize: () => void;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement) {
    if (!isWebGL2Available()) {
      throw new WebGLInitError(
        'WebGL2 is required. Please use a modern desktop browser with hardware acceleration enabled.',
      );
    }

    this.canvas = canvas;

    try {
      this.renderer = new WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch (error) {
      throw new WebGLInitError('Failed to create a WebGL2 renderer.', { cause: error });
    }

    if (!this.renderer.capabilities.isWebGL2) {
      this.renderer.dispose();
      throw new WebGLInitError('WebGL2 is required. The current GPU context is WebGL 1 only.');
    }

    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.setClearColor(0x0b1220);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const { width, height } = this.measureCanvas();
    this.renderer.setSize(width, height, false);
    this.bootstrap = createBootstrapScene(width / Math.max(height, 1));

    this.handleResize = () => {
      this.resize();
    };
    window.addEventListener('resize', this.handleResize);
  }

  render(elapsedSeconds: number): void {
    if (this.disposed) {
      return;
    }

    this.bootstrap.marker.rotation.y = elapsedSeconds * 0.7;
    this.renderer.render(this.bootstrap.scene, this.bootstrap.camera);
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    window.removeEventListener('resize', this.handleResize);
    this.bootstrap.dispose();
    this.renderer.dispose();
  }

  private resize(): void {
    if (this.disposed) {
      return;
    }

    const { width, height } = this.measureCanvas();
    if (width === 0 || height === 0) {
      return;
    }

    this.renderer.setSize(width, height, false);
    this.bootstrap.camera.aspect = width / height;
    this.bootstrap.camera.updateProjectionMatrix();
  }

  private measureCanvas(): { width: number; height: number } {
    return {
      width: this.canvas.clientWidth || window.innerWidth || 1,
      height: this.canvas.clientHeight || window.innerHeight || 1,
    };
  }
}
