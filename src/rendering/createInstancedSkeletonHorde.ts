import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  DynamicDrawUsage,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  type BufferGeometry,
  type Material,
  type Scene,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

import { VISUAL_DEATH_LINGER } from '../config/combat';
import type { EnemySnapshot } from '../world/World';
import { selectSkeletonAnim } from './characterPose';
import { InstanceSlotPool } from './instanceSlotPool';
import {
  computeSkeletonPartPose,
  skeletonHitTint,
  SKELETON_HEAD_LOCAL,
  SKELETON_LEFT_ARM_LOCAL,
  SKELETON_LEFT_LEG_LOCAL,
  SKELETON_LEFT_SOCKET_LOCAL,
  SKELETON_RIGHT_ARM_LOCAL,
  SKELETON_RIGHT_LEG_LOCAL,
  SKELETON_RIGHT_SOCKET_LOCAL,
} from './skeletonPartPose';

export const SKELETON_INSTANCE_CAPACITY = 256;

interface LingeringVisual {
  remaining: number;
  x: number;
  y: number;
  z: number;
  facingYaw: number;
}

interface KnownPose {
  x: number;
  y: number;
  z: number;
  facingYaw: number;
}

export interface InstancedSkeletonHorde {
  sync(enemies: readonly EnemySnapshot[], deltaSeconds: number): void;
  getActiveCount(): number;
  reset(): void;
  dispose(): void;
}

export function createInstancedSkeletonHorde(
  scene: Scene,
  capacity: number = SKELETON_INSTANCE_CAPACITY,
): InstancedSkeletonHorde {
  const bone = new MeshStandardMaterial({
    color: 0xf8f0de,
    emissive: 0x3a3428,
    roughness: 0.46,
    metalness: 0.06,
  });
  const socket = new MeshStandardMaterial({
    color: 0x161210,
    roughness: 0.72,
    metalness: 0,
  });

  const skull = new SphereGeometry(0.23, 10, 8);
  const jaw = new BoxGeometry(0.18, 0.07, 0.14);
  const cheek = new SphereGeometry(0.07, 6, 5);
  const ribWide = new BoxGeometry(0.34, 0.05, 0.16);
  const spine = new CylinderGeometry(0.04, 0.045, 0.42, 6);
  const pelvis = new BoxGeometry(0.28, 0.1, 0.18);
  const boneArm = new CylinderGeometry(0.035, 0.04, 0.44, 6);
  const boneLeg = new CylinderGeometry(0.045, 0.05, 0.5, 6);
  const hand = new SphereGeometry(0.045, 6, 5);
  const foot = new BoxGeometry(0.08, 0.05, 0.14);
  const eye = new SphereGeometry(0.055, 8, 6);

  const headGeometry = mergePlaced([
    { geometry: skull, x: 0, y: 0, z: 0 },
    { geometry: jaw, x: 0, y: -0.18, z: 0.05 },
    { geometry: cheek, x: -0.14, y: -0.04, z: 0.08 },
    { geometry: cheek, x: 0.14, y: -0.04, z: 0.08 },
  ]);
  const torsoGeometry = mergePlaced([
    { geometry: spine, x: 0, y: 0.92, z: 0 },
    { geometry: ribWide, x: 0, y: 1.08, z: 0.02 },
    { geometry: ribWide, x: 0, y: 0.96, z: 0.02 },
    { geometry: ribWide, x: 0, y: 0.84, z: 0.02 },
    { geometry: pelvis, x: 0, y: 0.64, z: 0 },
  ]);
  const armGeometry = mergePlaced([
    { geometry: boneArm, x: 0, y: -0.18, z: 0 },
    { geometry: hand, x: 0, y: -0.4, z: 0.02 },
  ]);
  const legGeometry = mergePlaced([
    { geometry: boneLeg, x: 0, y: -0.22, z: 0 },
    { geometry: foot, x: 0, y: -0.48, z: 0.04 },
  ]);

  skull.dispose();
  jaw.dispose();
  cheek.dispose();
  ribWide.dispose();
  spine.dispose();
  pelvis.dispose();
  boneArm.dispose();
  boneLeg.dispose();
  hand.dispose();
  foot.dispose();

  const geometries: BufferGeometry[] = [headGeometry, torsoGeometry, armGeometry, legGeometry, eye];
  const materials: Material[] = [bone, socket];

  const head = createPartMesh(headGeometry, bone, capacity);
  const torso = createPartMesh(torsoGeometry, bone, capacity);
  const leftArm = createPartMesh(armGeometry, bone, capacity);
  const rightArm = createPartMesh(armGeometry, bone, capacity);
  const leftLeg = createPartMesh(legGeometry, bone, capacity);
  const rightLeg = createPartMesh(legGeometry, bone, capacity);
  const leftSocket = createPartMesh(eye, socket, capacity);
  const rightSocket = createPartMesh(eye, socket, capacity);
  const parts = [head, torso, leftArm, rightArm, leftLeg, rightLeg, leftSocket, rightSocket];
  scene.add(...parts);

  const pool = new InstanceSlotPool(capacity);
  const lingering = new Map<number, LingeringVisual>();
  const lastKnown = new Map<number, KnownPose>();
  const phases = new Float32Array(capacity);
  const root = new Object3D();
  const body = new Object3D();
  const local = new Object3D();
  const bodyWorld = new Matrix4();
  const partWorld = new Matrix4();
  const headWorld = new Matrix4();
  const scratch = new Matrix4();
  const color = new Color();
  let disposed = false;

  const commitCounts = (): void => {
    for (const mesh of parts) {
      mesh.count = pool.size;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor !== null) {
        mesh.instanceColor.needsUpdate = true;
      }
    }
  };

  const copySlot = (from: number, to: number): void => {
    for (const mesh of parts) {
      mesh.getMatrixAt(from, scratch);
      mesh.setMatrixAt(to, scratch);
      mesh.getColorAt(from, color);
      mesh.setColorAt(to, color);
    }
    phases[to] = phases[from] ?? 0;
  };

  const writeSlot = (
    slot: number,
    enemy: Pick<
      EnemySnapshot,
      | 'id'
      | 'x'
      | 'y'
      | 'z'
      | 'facingYaw'
      | 'hitAmount'
      | 'deathAmount'
      | 'moving'
      | 'contacting'
      | 'lifecycle'
    >,
    deltaSeconds: number,
  ): void => {
    phases[slot] = (phases[slot] ?? 0) + deltaSeconds;
    const phase = phases[slot] ?? 0;
    const pose = computeSkeletonPartPose(
      selectSkeletonAnim({
        moving: enemy.moving,
        contacting: enemy.contacting,
        hitAmount: enemy.hitAmount,
        lifecycle: enemy.lifecycle,
      }),
      phase,
      enemy.hitAmount,
      enemy.deathAmount,
      enemy.id * 1.7,
    );

    root.position.set(enemy.x, enemy.y, enemy.z);
    root.rotation.set(0, enemy.facingYaw, 0);
    root.scale.setScalar(pose.rootScale);
    root.updateMatrix();

    body.position.set(0, pose.bodyY, 0);
    body.rotation.set(pose.bodyRotX, 0, pose.bodyRotZ);
    body.scale.set(1, 1, 1);
    body.updateMatrix();
    bodyWorld.multiplyMatrices(root.matrix, body.matrix);

    setPart(torso, slot, bodyWorld, 0, 0, 0, 0, 0, 0, local, partWorld);
    setPart(
      head,
      slot,
      bodyWorld,
      SKELETON_HEAD_LOCAL.x,
      SKELETON_HEAD_LOCAL.y,
      SKELETON_HEAD_LOCAL.z,
      0,
      0,
      0,
      local,
      headWorld,
    );
    setPart(
      leftArm,
      slot,
      bodyWorld,
      SKELETON_LEFT_ARM_LOCAL.x,
      SKELETON_LEFT_ARM_LOCAL.y,
      SKELETON_LEFT_ARM_LOCAL.z,
      pose.leftArmRotX,
      0,
      pose.leftArmRotZ,
      local,
      partWorld,
    );
    setPart(
      rightArm,
      slot,
      bodyWorld,
      SKELETON_RIGHT_ARM_LOCAL.x,
      SKELETON_RIGHT_ARM_LOCAL.y,
      SKELETON_RIGHT_ARM_LOCAL.z,
      pose.rightArmRotX,
      0,
      pose.rightArmRotZ,
      local,
      partWorld,
    );
    setPart(
      leftLeg,
      slot,
      bodyWorld,
      SKELETON_LEFT_LEG_LOCAL.x,
      SKELETON_LEFT_LEG_LOCAL.y,
      SKELETON_LEFT_LEG_LOCAL.z,
      pose.leftLegRotX,
      0,
      0,
      local,
      partWorld,
    );
    setPart(
      rightLeg,
      slot,
      bodyWorld,
      SKELETON_RIGHT_LEG_LOCAL.x,
      SKELETON_RIGHT_LEG_LOCAL.y,
      SKELETON_RIGHT_LEG_LOCAL.z,
      pose.rightLegRotX,
      0,
      0,
      local,
      partWorld,
    );
    setPart(
      leftSocket,
      slot,
      headWorld,
      SKELETON_LEFT_SOCKET_LOCAL.x,
      SKELETON_LEFT_SOCKET_LOCAL.y,
      SKELETON_LEFT_SOCKET_LOCAL.z,
      0,
      0,
      0,
      local,
      partWorld,
    );
    setPart(
      rightSocket,
      slot,
      headWorld,
      SKELETON_RIGHT_SOCKET_LOCAL.x,
      SKELETON_RIGHT_SOCKET_LOCAL.y,
      SKELETON_RIGHT_SOCKET_LOCAL.z,
      0,
      0,
      0,
      local,
      partWorld,
    );

    const tint = skeletonHitTint(enemy.hitAmount);
    color.setRGB(tint.r, tint.g, tint.b);
    for (const mesh of parts) {
      mesh.setColorAt(slot, color);
    }
  };

  const releaseId = (id: number): void => {
    lastKnown.delete(id);
    const released = pool.release(id);
    if (released === null) {
      return;
    }
    if (released.swappedFrom !== null) {
      copySlot(released.swappedFrom, released.vacated);
    }
  };

  return {
    sync(enemies, deltaSeconds): void {
      if (disposed) {
        return;
      }

      const living = new Set<number>();
      for (const enemy of enemies) {
        living.add(enemy.id);
        lingering.delete(enemy.id);
        lastKnown.set(enemy.id, {
          x: enemy.x,
          y: enemy.y,
          z: enemy.z,
          facingYaw: enemy.facingYaw,
        });
        const existed = pool.has(enemy.id);
        const slot = pool.acquire(enemy.id);
        if (slot === null) {
          continue;
        }
        if (!existed) {
          phases[slot] = 0;
        }
        writeSlot(slot, enemy, deltaSeconds);
      }

      for (const [id, visual] of lingering) {
        visual.remaining -= deltaSeconds;
        if (visual.remaining <= 0) {
          lingering.delete(id);
          releaseId(id);
          continue;
        }
        const slot = pool.get(id);
        if (slot === undefined) {
          lingering.delete(id);
          continue;
        }
        writeSlot(
          slot,
          {
            id,
            x: visual.x,
            y: visual.y,
            z: visual.z,
            facingYaw: visual.facingYaw,
            lifecycle: 'dead',
            hitAmount: 0,
            deathAmount: Math.min(1, 1 - visual.remaining / VISUAL_DEATH_LINGER),
            moving: false,
            contacting: false,
          },
          deltaSeconds,
        );
      }

      for (const id of pool.ids()) {
        if (living.has(id) || lingering.has(id)) {
          continue;
        }
        const known = lastKnown.get(id);
        if (known === undefined) {
          releaseId(id);
          continue;
        }
        lingering.set(id, { remaining: VISUAL_DEATH_LINGER, ...known });
        const slot = pool.get(id);
        if (slot === undefined) {
          continue;
        }
        writeSlot(
          slot,
          {
            id,
            x: known.x,
            y: known.y,
            z: known.z,
            facingYaw: known.facingYaw,
            lifecycle: 'dead',
            hitAmount: 0,
            deathAmount: 0,
            moving: false,
            contacting: false,
          },
          0,
        );
      }

      commitCounts();
    },
    getActiveCount(): number {
      return pool.size;
    },
    reset(): void {
      lingering.clear();
      lastKnown.clear();
      pool.reset();
      phases.fill(0);
      commitCounts();
    },
    dispose(): void {
      if (disposed) {
        return;
      }
      disposed = true;
      lingering.clear();
      lastKnown.clear();
      pool.reset();
      for (const mesh of parts) {
        scene.remove(mesh);
        mesh.dispose();
      }
      for (const geometry of geometries) {
        geometry.dispose();
      }
      for (const material of materials) {
        material.dispose();
      }
    },
  };
}

function createPartMesh(
  geometry: BufferGeometry,
  material: MeshStandardMaterial,
  capacity: number,
): InstancedMesh {
  const mesh = new InstancedMesh(geometry, material, capacity);
  mesh.frustumCulled = false;
  mesh.count = 0;
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);
  const white = new Color(1, 1, 1);
  for (let index = 0; index < capacity; index += 1) {
    mesh.setColorAt(index, white);
  }
  if (mesh.instanceColor !== null) {
    mesh.instanceColor.setUsage(DynamicDrawUsage);
  }
  return mesh;
}

function mergePlaced(
  parts: ReadonlyArray<{ geometry: BufferGeometry; x: number; y: number; z: number }>,
): BufferGeometry {
  const clones = parts.map((part) => {
    const geometry = part.geometry.clone();
    geometry.applyMatrix4(new Matrix4().makeTranslation(part.x, part.y, part.z));
    return geometry;
  });
  const merged = mergeGeometries(clones, false);
  for (const clone of clones) {
    clone.dispose();
  }
  if (merged === null) {
    throw new Error('Failed to merge skeleton part geometry.');
  }
  return merged;
}

function setPart(
  mesh: InstancedMesh,
  slot: number,
  parentWorld: Matrix4,
  x: number,
  y: number,
  z: number,
  rotX: number,
  rotY: number,
  rotZ: number,
  local: Object3D,
  out: Matrix4,
): void {
  local.position.set(x, y, z);
  local.rotation.set(rotX, rotY, rotZ);
  local.scale.set(1, 1, 1);
  local.updateMatrix();
  out.multiplyMatrices(parentWorld, local.matrix);
  mesh.setMatrixAt(slot, out);
}
