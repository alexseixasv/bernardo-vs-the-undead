import { PerspectiveCamera, SRGBColorSpace, WebGLRenderer } from 'three';

import {
  CAMERA_FAR,
  CAMERA_FOV,
  CAMERA_NEAR,
  CAMERA_OFFSET,
  PLAYER_LOOK_HEIGHT,
} from '../config/world';
import type { PlayerSnapshot } from '../world/World';
import { type Vec3, stepCameraFollow } from './cameraFollow';
import { type BernardoPlaceholder, createBernardoPlaceholder } from './createBernardoPlaceholder';
import { type ForestArena, createForestArena } from './createForestArena';
import { isWebGL2Available, WebGLInitError } from './webgl';

export class GameRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: WebGLRenderer;
  private readonly camera: PerspectiveCamera;
  private readonly forest: ForestArena;
  private readonly bernardo: BernardoPlaceholder;
  private readonly handleResize: () => void;
  private lookAt: Vec3 = { x: 0, y: PLAYER_LOOK_HEIGHT, z: 0 };
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

    this.camera = new PerspectiveCamera(
      CAMERA_FOV,
      width / Math.max(height, 1),
      CAMERA_NEAR,
      CAMERA_FAR,
    );
    this.camera.position.set(CAMERA_OFFSET.x, CAMERA_OFFSET.y, CAMERA_OFFSET.z);
    this.camera.lookAt(0, PLAYER_LOOK_HEIGHT, 0);

    this.forest = createForestArena();
    this.bernardo = createBernardoPlaceholder();
    this.forest.scene.add(this.bernardo.group);

    this.handleResize = () => {
      this.resize();
    };
    window.addEventListener('resize', this.handleResize);
  }

  render(player: PlayerSnapshot, deltaSeconds: number): void {
    if (this.disposed) {
      return;
    }

    this.bernardo.group.position.set(player.x, player.y, player.z);
    this.bernardo.group.rotation.y = player.facingYaw;

    const pose = stepCameraFollow(
      this.lookAt,
      { x: player.x, y: player.y + PLAYER_LOOK_HEIGHT, z: player.z },
      deltaSeconds,
    );
    this.lookAt = pose.lookAt;
    this.camera.position.set(pose.position.x, pose.position.y, pose.position.z);
    this.camera.lookAt(pose.lookAt.x, pose.lookAt.y, pose.lookAt.z);

    this.renderer.render(this.forest.scene, this.camera);
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    window.removeEventListener('resize', this.handleResize);
    this.forest.scene.remove(this.bernardo.group);
    this.bernardo.dispose();
    this.forest.dispose();
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
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private measureCanvas(): { width: number; height: number } {
    return {
      width: this.canvas.clientWidth || window.innerWidth || 1,
      height: this.canvas.clientHeight || window.innerHeight || 1,
    };
  }
}
