import {
  BoxGeometry,
  Color,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  RingGeometry,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three';

import { ATTACK_PULSE_DURATION } from '../config/combat';
import { SWORD_SLASH_DURATION } from '../config/progression';
import {
  CAMERA_FAR,
  CAMERA_FOV,
  CAMERA_NEAR,
  CAMERA_OFFSET,
  PLAYER_LOOK_HEIGHT,
} from '../config/world';
import type { EnemySnapshot, GemSnapshot, WorldSnapshot } from '../world/World';
import { type Vec3, stepCameraFollow } from './cameraFollow';
import { type BernardoPlaceholder, createBernardoPlaceholder } from './createBernardoPlaceholder';
import { type ForestArena, createForestArena } from './createForestArena';
import { type SkeletonAssets, createSkeletonAssets } from './createSkeletonPlaceholder';
import { type XpGemAssets, createXpGemAssets } from './createXpGemPlaceholder';
import { isWebGL2Available, WebGLInitError } from './webgl';

export class GameRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: WebGLRenderer;
  private readonly camera: PerspectiveCamera;
  private readonly forest: ForestArena;
  private readonly bernardo: BernardoPlaceholder;
  private readonly skeletons: SkeletonAssets;
  private readonly gems: XpGemAssets;
  private readonly skeletonViews = new Map<number, ReturnType<SkeletonAssets['createView']>>();
  private readonly gemViews = new Map<number, ReturnType<XpGemAssets['createView']>>();
  private readonly pulse: Mesh;
  private readonly pulseMaterial: MeshBasicMaterial;
  private readonly slash: Mesh;
  private readonly slashMaterial: MeshBasicMaterial;
  private readonly handleResize: () => void;
  private lookAt: Vec3 = { x: 0, y: PLAYER_LOOK_HEIGHT, z: 0 };
  private fxTime = 0;
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
    this.renderer.setClearColor(0x1c2d44);
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
    this.skeletons = createSkeletonAssets();
    this.gems = createXpGemAssets();
    this.forest.scene.add(this.bernardo.group);

    this.pulseMaterial = new MeshBasicMaterial({
      color: new Color(0xfff1a3),
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.pulse = new Mesh(new RingGeometry(0.35, 0.55, 24), this.pulseMaterial);
    this.pulse.rotation.x = -Math.PI / 2;
    this.pulse.visible = false;
    this.forest.scene.add(this.pulse);

    this.slashMaterial = new MeshBasicMaterial({
      color: new Color(0x9ef7ff),
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.slash = new Mesh(new BoxGeometry(0.22, 0.08, 1), this.slashMaterial);
    this.slash.visible = false;
    this.forest.scene.add(this.slash);

    this.handleResize = () => {
      this.resize();
    };
    window.addEventListener('resize', this.handleResize);
  }

  render(snapshot: WorldSnapshot, deltaSeconds: number): void {
    if (this.disposed) {
      return;
    }

    this.fxTime += deltaSeconds;

    const { player } = snapshot;
    this.bernardo.group.position.set(player.x, player.y, player.z);
    this.bernardo.group.rotation.y = player.facingYaw;
    this.bernardo.group.scale.setScalar(1 + player.hurtAmount * 0.08);
    this.bernardo.fillLight.intensity = 2.4 + player.hurtAmount * 3.2;
    this.bernardo.fillLight.color.setRGB(
      1,
      0.95 - player.hurtAmount * 0.6,
      0.78 - player.hurtAmount * 0.78,
    );

    this.syncSkeletons(snapshot.enemies);
    this.syncGems(snapshot.gems);
    this.syncPulse(snapshot);
    this.syncSlash(snapshot);

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

  resetForNewRun(): void {
    this.clearSkeletons();
    this.clearGems();
    this.lookAt = { x: 0, y: PLAYER_LOOK_HEIGHT, z: 0 };
    this.fxTime = 0;
    this.pulse.visible = false;
    this.slash.visible = false;
    this.bernardo.group.scale.setScalar(1);
    this.bernardo.fillLight.intensity = 2.4;
    this.bernardo.fillLight.color.setHex(0xfff3c8);
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    window.removeEventListener('resize', this.handleResize);
    this.clearSkeletons();
    this.clearGems();
    this.forest.scene.remove(this.bernardo.group);
    this.forest.scene.remove(this.pulse);
    this.forest.scene.remove(this.slash);
    this.pulse.geometry.dispose();
    this.pulseMaterial.dispose();
    this.slash.geometry.dispose();
    this.slashMaterial.dispose();
    this.bernardo.dispose();
    this.skeletons.dispose();
    this.gems.dispose();
    this.forest.dispose();
    this.renderer.dispose();
  }

  private syncSkeletons(enemies: readonly EnemySnapshot[]): void {
    const seen = new Set<number>();

    for (const enemy of enemies) {
      seen.add(enemy.id);
      let view = this.skeletonViews.get(enemy.id);
      if (view === undefined) {
        view = this.skeletons.createView();
        this.forest.scene.add(view);
        this.skeletonViews.set(enemy.id, view);
      }

      const deathScale = Math.max(0.05, 1 - enemy.deathAmount);
      const hitScale = 1 + enemy.hitAmount * 0.18;
      view.position.set(enemy.x, enemy.y, enemy.z);
      view.rotation.y = enemy.facingYaw;
      view.scale.setScalar(deathScale * hitScale);
    }

    for (const [id, view] of this.skeletonViews) {
      if (seen.has(id)) {
        continue;
      }
      this.forest.scene.remove(view);
      this.skeletonViews.delete(id);
    }
  }

  private syncGems(gems: readonly GemSnapshot[]): void {
    const seen = new Set<number>();

    for (const gem of gems) {
      seen.add(gem.id);
      let view = this.gemViews.get(gem.id);
      if (view === undefined) {
        view = this.gems.createView();
        this.forest.scene.add(view);
        this.gemViews.set(gem.id, view);
      }

      const bob = Math.sin(this.fxTime * 5 + gem.id * 1.7) * 0.08;
      view.position.set(gem.x, 0.38 + bob, gem.z);
      view.rotation.y = this.fxTime * 2.4 + gem.id;
    }

    for (const [id, view] of this.gemViews) {
      if (seen.has(id)) {
        continue;
      }
      this.forest.scene.remove(view);
      this.gemViews.delete(id);
    }
  }

  private syncPulse(snapshot: WorldSnapshot): void {
    const pulse = snapshot.pulse;
    if (pulse === null) {
      this.pulse.visible = false;
      return;
    }

    const progress = 1 - pulse.remaining / ATTACK_PULSE_DURATION;
    this.pulse.visible = true;
    this.pulse.position.set(pulse.fromX, 0.12, pulse.fromZ);
    this.pulse.scale.setScalar(1 + progress * 2.4);
    this.pulseMaterial.opacity = 0.85 * (1 - progress);
  }

  private syncSlash(snapshot: WorldSnapshot): void {
    const slash = snapshot.slash;
    if (slash === null) {
      this.slash.visible = false;
      return;
    }

    const progress = 1 - slash.remaining / SWORD_SLASH_DURATION;
    const length = Math.max(0.8, slash.range);
    this.slash.visible = true;
    this.slash.scale.set(1 + progress * 0.35, 1, length);
    this.slash.position.set(
      slash.x + Math.sin(slash.yaw) * (length * 0.55),
      0.9,
      slash.z + Math.cos(slash.yaw) * (length * 0.55),
    );
    this.slash.rotation.y = slash.yaw;
    this.slashMaterial.opacity = 0.9 * (1 - progress);
  }

  private clearSkeletons(): void {
    for (const view of this.skeletonViews.values()) {
      this.forest.scene.remove(view);
    }
    this.skeletonViews.clear();
  }

  private clearGems(): void {
    for (const view of this.gemViews.values()) {
      this.forest.scene.remove(view);
    }
    this.gemViews.clear();
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
