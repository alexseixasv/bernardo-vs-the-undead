import {
  BoxGeometry,
  Color,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  RingGeometry,
  SphereGeometry,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three';

import { ATTACK_PULSE_DURATION } from '../config/combat';
import { SWORD_SLASH_DURATION, XP_PER_GEM } from '../config/progression';
import {
  CAMERA_FAR,
  CAMERA_FOV,
  CAMERA_NEAR,
  CAMERA_OFFSET,
  CAMERA_SHAKE_AMOUNT,
  PLAYER_LOOK_HEIGHT,
} from '../config/world';
import type { GemSnapshot, WorldSnapshot } from '../world/World';
import { type Vec3, stepCameraFollow } from './cameraFollow';
import { selectBernardoAnim } from './characterPose';
import { type BernardoPlaceholder, createBernardoPlaceholder } from './createBernardoPlaceholder';
import { type ForestArena, createForestArena } from './createForestArena';
import {
  type InstancedSkeletonHorde,
  createInstancedSkeletonHorde,
} from './createInstancedSkeletonHorde';
import { type XpGemAssets, createXpGemAssets } from './createXpGemPlaceholder';
import { isWebGL2Available, WebGLInitError } from './webgl';

export interface RendererStats {
  calls: number;
  triangles: number;
  geometries: number;
  textures: number;
  enemies: number;
  gems: number;
}

export class GameRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: WebGLRenderer;
  private readonly camera: PerspectiveCamera;
  private readonly forest: ForestArena;
  private readonly bernardo: BernardoPlaceholder;
  private readonly skeletons: InstancedSkeletonHorde;
  private readonly gems: XpGemAssets;
  private readonly gemViews = new Map<number, ReturnType<XpGemAssets['createView']>>();
  private readonly pulse: Mesh;
  private readonly pulseOuter: Mesh;
  private readonly pulseMaterial: MeshBasicMaterial;
  private readonly pulseOuterMaterial: MeshBasicMaterial;
  private readonly impact: Mesh;
  private readonly impactMaterial: MeshBasicMaterial;
  private readonly slash: Mesh;
  private readonly slashArc: Mesh;
  private readonly slashMaterial: MeshBasicMaterial;
  private readonly slashArcMaterial: MeshBasicMaterial;
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
    this.skeletons = createInstancedSkeletonHorde(this.forest.scene);
    this.gems = createXpGemAssets();
    this.forest.scene.add(this.bernardo.group);

    this.pulseMaterial = new MeshBasicMaterial({
      color: new Color(0xfff1a3),
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.pulseOuterMaterial = new MeshBasicMaterial({
      color: new Color(0x7ad7ff),
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.pulse = new Mesh(new RingGeometry(0.28, 0.5, 28), this.pulseMaterial);
    this.pulse.rotation.x = -Math.PI / 2;
    this.pulse.visible = false;
    this.pulseOuter = new Mesh(new RingGeometry(0.5, 0.68, 28), this.pulseOuterMaterial);
    this.pulseOuter.rotation.x = -Math.PI / 2;
    this.pulseOuter.visible = false;
    this.forest.scene.add(this.pulse, this.pulseOuter);

    this.impactMaterial = new MeshBasicMaterial({
      color: new Color(0xfff6c4),
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.impact = new Mesh(new SphereGeometry(0.16, 8, 6), this.impactMaterial);
    this.impact.visible = false;
    this.forest.scene.add(this.impact);

    this.slashMaterial = new MeshBasicMaterial({
      color: new Color(0xb8fbff),
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.slashArcMaterial = new MeshBasicMaterial({
      color: new Color(0x5ce1ff),
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.slash = new Mesh(new BoxGeometry(0.12, 0.08, 1), this.slashMaterial);
    this.slash.visible = false;
    this.slashArc = new Mesh(new BoxGeometry(0.06, 0.22, 1), this.slashArcMaterial);
    this.slashArc.visible = false;
    this.forest.scene.add(this.slash, this.slashArc);

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
    this.bernardo.fillLight.intensity = 2.5 + player.hurtAmount * 3.2;
    this.bernardo.fillLight.color.setRGB(
      1,
      0.95 - player.hurtAmount * 0.6,
      0.78 - player.hurtAmount * 0.78,
    );
    this.bernardo.sync(
      selectBernardoAnim({
        moving: player.moving,
        hurtAmount: player.hurtAmount,
        defeated: snapshot.status === 'gameOver',
      }),
      player.hurtAmount,
      deltaSeconds,
    );

    this.skeletons.sync(snapshot.enemies, deltaSeconds);
    this.syncGems(snapshot.gems);
    this.syncPulse(snapshot);
    this.syncSlash(snapshot);

    const pose = stepCameraFollow(
      this.lookAt,
      { x: player.x, y: player.y + PLAYER_LOOK_HEIGHT, z: player.z },
      deltaSeconds,
    );
    this.lookAt = pose.lookAt;
    const shake = player.hurtAmount * CAMERA_SHAKE_AMOUNT;
    const shakeX = shake === 0 ? 0 : Math.sin(this.fxTime * 55) * shake;
    const shakeZ = shake === 0 ? 0 : Math.cos(this.fxTime * 47) * shake;
    this.camera.position.set(pose.position.x + shakeX, pose.position.y, pose.position.z + shakeZ);
    this.camera.lookAt(pose.lookAt.x, pose.lookAt.y, pose.lookAt.z);

    this.renderer.render(this.forest.scene, this.camera);
  }

  getStats(): RendererStats {
    return {
      calls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures,
      enemies: this.skeletons.getActiveCount(),
      gems: this.gemViews.size,
    };
  }

  resetForNewRun(): void {
    this.skeletons.reset();
    this.clearGems();
    this.lookAt = { x: 0, y: PLAYER_LOOK_HEIGHT, z: 0 };
    this.fxTime = 0;
    this.pulse.visible = false;
    this.pulseOuter.visible = false;
    this.impact.visible = false;
    this.slash.visible = false;
    this.slashArc.visible = false;
    this.bernardo.resetPose();
    this.bernardo.fillLight.intensity = 2.5;
    this.bernardo.fillLight.color.setHex(0xfff3c8);
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    window.removeEventListener('resize', this.handleResize);
    this.skeletons.dispose();
    this.clearGems();
    this.forest.scene.remove(this.bernardo.group);
    this.forest.scene.remove(this.pulse, this.pulseOuter, this.impact, this.slash, this.slashArc);
    this.pulse.geometry.dispose();
    this.pulseOuter.geometry.dispose();
    this.impact.geometry.dispose();
    this.slash.geometry.dispose();
    this.slashArc.geometry.dispose();
    this.pulseMaterial.dispose();
    this.pulseOuterMaterial.dispose();
    this.impactMaterial.dispose();
    this.slashMaterial.dispose();
    this.slashArcMaterial.dispose();
    this.bernardo.dispose();
    this.gems.dispose();
    this.forest.dispose();
    this.renderer.dispose();
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
      const bulk = 1 + Math.min(0.7, Math.max(0, gem.xp / XP_PER_GEM - 1) * 0.12);
      view.position.set(gem.x, 0.38 + bob, gem.z);
      view.rotation.y = this.fxTime * 2.4 + gem.id;
      view.scale.setScalar(bulk);
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
      this.pulseOuter.visible = false;
      this.impact.visible = false;
      return;
    }

    const progress = 1 - pulse.remaining / ATTACK_PULSE_DURATION;
    this.pulse.visible = true;
    this.pulseOuter.visible = true;
    this.pulse.position.set(pulse.fromX, 0.12, pulse.fromZ);
    this.pulseOuter.position.set(pulse.fromX, 0.12, pulse.fromZ);
    this.pulse.scale.setScalar(1 + progress * 2.8);
    this.pulseOuter.scale.setScalar(1 + progress * 3.2);
    this.pulseMaterial.opacity = 0.9 * (1 - progress);
    this.pulseOuterMaterial.opacity = 0.55 * (1 - progress);

    this.impact.visible = true;
    this.impact.position.set(pulse.toX, 0.7, pulse.toZ);
    this.impact.scale.setScalar(1 + progress * 1.4);
    this.impactMaterial.opacity = 0.7 * (1 - progress);
  }

  private syncSlash(snapshot: WorldSnapshot): void {
    const slash = snapshot.slash;
    if (slash === null) {
      this.slash.visible = false;
      this.slashArc.visible = false;
      return;
    }

    const progress = 1 - slash.remaining / SWORD_SLASH_DURATION;
    const length = Math.max(0.9, slash.range);
    const aheadX = slash.x + Math.sin(slash.yaw) * (length * 0.55);
    const aheadZ = slash.z + Math.cos(slash.yaw) * (length * 0.55);
    this.slash.visible = true;
    this.slashArc.visible = true;
    this.slash.scale.set(1, 1, length);
    this.slash.position.set(aheadX, 0.95, aheadZ);
    this.slash.rotation.set(progress * 0.35, slash.yaw, 0.4 - progress * 0.8);
    this.slashArc.scale.set(1 + progress * 0.4, 1, length * 0.85);
    this.slashArc.position.set(aheadX, 1.05, aheadZ);
    this.slashArc.rotation.set(-0.15, slash.yaw + 0.35, 0.9);
    this.slashMaterial.opacity = 0.95 * (1 - progress);
    this.slashArcMaterial.opacity = 0.7 * (1 - progress);
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
