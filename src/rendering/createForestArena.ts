import {
  AmbientLight,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  Fog,
  HemisphereLight,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Quaternion,
  Scene,
  SphereGeometry,
  Vector3,
} from 'three';

import { ARENA_HALF_EXTENT } from '../config/world';

export interface ForestArena {
  scene: Scene;
  dispose(): void;
}

interface InstanceTransform {
  position: Vector3;
  quaternion: Quaternion;
  scale: Vector3;
}

export function createForestArena(): ForestArena {
  const scene = new Scene();
  scene.background = new Color(0x1c2d44);
  scene.fog = new Fog(0x243850, 26, 72);

  const ambient = new AmbientLight(0xd5e2f5, 0.68);
  const hemisphere = new HemisphereLight(0xc3d6f0, 0x3a5a44, 0.82);
  const moon = new DirectionalLight(0xfff6de, 1.28);
  moon.position.set(10, 20, 9);
  scene.add(ambient, hemisphere, moon);

  const resources: Array<{ dispose(): void }> = [];
  const dummy = new Object3D();

  const playableGround = createGround(ARENA_HALF_EXTENT * 2, 0x4c8758);
  const outerGround = createGround(ARENA_HALF_EXTENT * 3.4, 0x326344);
  outerGround.mesh.position.y = -0.02;
  scene.add(outerGround.mesh, playableGround.mesh);
  resources.push(outerGround, playableGround);

  const treeRng = mulberry32(20261029);
  const trees = layoutTrees(treeRng);
  const trunk = createInstancedMesh(
    new CylinderGeometry(0.12, 0.18, 1.1, 6),
    new MeshStandardMaterial({ color: 0x4a3424, roughness: 0.9, metalness: 0.02 }),
    trees.map((tree) => ({
      position: new Vector3(tree.x, 0.55 * tree.scale, tree.z),
      quaternion: new Quaternion(),
      scale: new Vector3(tree.scale, tree.scale, tree.scale),
    })),
    dummy,
  );
  const canopy = createInstancedMesh(
    new ConeGeometry(0.7, 1.8, 7),
    new MeshStandardMaterial({ color: 0x3f9a58, roughness: 0.72, metalness: 0.02 }),
    trees.map((tree) => ({
      position: new Vector3(tree.x, 1.45 * tree.scale, tree.z),
      quaternion: new Quaternion(),
      scale: new Vector3(tree.scale, tree.scale, tree.scale),
    })),
    dummy,
    trees.map((tree) => tree.canopyColor),
  );
  const highCanopy = createInstancedMesh(
    new ConeGeometry(0.48, 1.2, 6),
    new MeshStandardMaterial({ color: 0x2f7a46, roughness: 0.74, metalness: 0.02 }),
    trees
      .filter((_, index) => index % 2 === 0)
      .map((tree) => ({
        position: new Vector3(tree.x, 2.15 * tree.scale, tree.z),
        quaternion: new Quaternion(),
        scale: new Vector3(tree.scale * 0.85, tree.scale * 0.9, tree.scale * 0.85),
      })),
    dummy,
  );
  scene.add(trunk.mesh, canopy.mesh, highCanopy.mesh);
  resources.push(trunk, canopy, highCanopy);

  const rockRng = mulberry32(77);
  const rocks = layoutRocks(rockRng);
  const rock = createInstancedMesh(
    new SphereGeometry(0.28, 6, 5),
    new MeshStandardMaterial({ color: 0x9aa195, roughness: 0.92, metalness: 0.04 }),
    rocks,
    dummy,
  );
  scene.add(rock.mesh);
  resources.push(rock);

  const grassRng = mulberry32(91);
  const grass = layoutGrass(grassRng);
  const tuft = createInstancedMesh(
    new ConeGeometry(0.12, 0.28, 5),
    new MeshStandardMaterial({ color: 0x63a85a, roughness: 0.82, metalness: 0 }),
    grass,
    dummy,
  );
  scene.add(tuft.mesh);
  resources.push(tuft);

  const bushRng = mulberry32(113);
  const bushes = layoutBushes(bushRng);
  const bush = createInstancedMesh(
    new SphereGeometry(0.32, 7, 5),
    new MeshStandardMaterial({ color: 0x2f6b40, roughness: 0.86, metalness: 0 }),
    bushes,
    dummy,
  );
  scene.add(bush.mesh);
  resources.push(bush);

  const mushroomRng = mulberry32(131);
  const mushroomStems = layoutMushrooms(mushroomRng);
  const stem = createInstancedMesh(
    new CylinderGeometry(0.04, 0.05, 0.16, 5),
    new MeshStandardMaterial({ color: 0xf2e6c9, roughness: 0.8, metalness: 0 }),
    mushroomStems.stems,
    dummy,
  );
  const cap = createInstancedMesh(
    new SphereGeometry(0.11, 7, 5),
    new MeshStandardMaterial({ color: 0xc45c6a, roughness: 0.62, metalness: 0.04 }),
    mushroomStems.caps,
    dummy,
    mushroomStems.capColors,
  );
  scene.add(stem.mesh, cap.mesh);
  resources.push(stem, cap);

  const stones = layoutBoundaryStones();
  const boundary = createInstancedMesh(
    new SphereGeometry(0.22, 6, 5),
    new MeshStandardMaterial({ color: 0x8a8474, roughness: 0.88, metalness: 0.05 }),
    stones,
    dummy,
  );
  scene.add(boundary.mesh);
  resources.push(boundary);

  return {
    scene,
    dispose(): void {
      for (const resource of resources) {
        resource.dispose();
      }
    },
  };
}

function createGround(size: number, color: number): { mesh: Mesh; dispose(): void } {
  const geometry = new PlaneGeometry(size, size);
  const material = new MeshStandardMaterial({
    color,
    roughness: 0.95,
    metalness: 0.02,
  });
  const mesh = new Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = false;
  return {
    mesh,
    dispose(): void {
      geometry.dispose();
      material.dispose();
    },
  };
}

function createInstancedMesh(
  geometry: SphereGeometry | ConeGeometry | CylinderGeometry,
  material: MeshStandardMaterial,
  transforms: InstanceTransform[],
  dummy: Object3D,
  colors?: number[],
): { mesh: InstancedMesh; dispose(): void } {
  const mesh = new InstancedMesh(geometry, material, transforms.length);
  mesh.frustumCulled = true;

  transforms.forEach((transform, index) => {
    dummy.position.copy(transform.position);
    dummy.quaternion.copy(transform.quaternion);
    dummy.scale.copy(transform.scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
    const color = colors?.[index];
    if (color !== undefined) {
      mesh.setColorAt(index, new Color(color));
    }
  });

  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) {
    mesh.instanceColor.needsUpdate = true;
  }

  return {
    mesh,
    dispose(): void {
      geometry.dispose();
      material.dispose();
      mesh.dispose();
    },
  };
}

function layoutTrees(
  random: () => number,
): Array<{ x: number; z: number; scale: number; canopyColor: number }> {
  const trees: Array<{ x: number; z: number; scale: number; canopyColor: number }> = [];
  const colors = [0x3f9a58, 0x4eab66, 0x2f7a46, 0x58b56f];
  const ringCount = 36;
  const innerCount = 10;

  for (let index = 0; index < ringCount; index += 1) {
    const angle = (index / ringCount) * Math.PI * 2 + random() * 0.12;
    const radius = ARENA_HALF_EXTENT + 2.2 + random() * 4.5;
    trees.push({
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      scale: 0.85 + random() * 0.55,
      canopyColor: colors[index % colors.length] ?? 0x3f9a58,
    });
  }

  for (let index = 0; index < innerCount; index += 1) {
    const angle = random() * Math.PI * 2;
    const radius = 9 + random() * 5;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (Math.hypot(x, z) < 7) {
      continue;
    }
    trees.push({
      x,
      z,
      scale: 0.7 + random() * 0.4,
      canopyColor: colors[(index + 2) % colors.length] ?? 0x245c3c,
    });
  }

  return trees;
}

function layoutRocks(random: () => number): InstanceTransform[] {
  const rocks: InstanceTransform[] = [];
  for (let index = 0; index < 22; index += 1) {
    const angle = random() * Math.PI * 2;
    const radius = 6 + random() * (ARENA_HALF_EXTENT - 7);
    rocks.push({
      position: new Vector3(Math.cos(angle) * radius, 0.08, Math.sin(angle) * radius),
      quaternion: new Quaternion().setFromAxisAngle(
        new Vector3(random(), 1, random()),
        random() * Math.PI,
      ),
      scale: new Vector3(0.7 + random() * 1.1, 0.35 + random() * 0.5, 0.6 + random() * 1),
    });
  }
  return rocks;
}

function layoutGrass(random: () => number): InstanceTransform[] {
  const grass: InstanceTransform[] = [];
  for (let index = 0; index < 48; index += 1) {
    const angle = random() * Math.PI * 2;
    const radius = 2.5 + random() * (ARENA_HALF_EXTENT - 3);
    grass.push({
      position: new Vector3(Math.cos(angle) * radius, 0.12, Math.sin(angle) * radius),
      quaternion: new Quaternion(),
      scale: new Vector3(0.8 + random() * 0.6, 0.7 + random() * 0.8, 0.8 + random() * 0.6),
    });
  }
  return grass;
}

function layoutBushes(random: () => number): InstanceTransform[] {
  const bushes: InstanceTransform[] = [];
  for (let index = 0; index < 18; index += 1) {
    const angle = random() * Math.PI * 2;
    const radius = 8 + random() * (ARENA_HALF_EXTENT - 9);
    bushes.push({
      position: new Vector3(Math.cos(angle) * radius, 0.16, Math.sin(angle) * radius),
      quaternion: new Quaternion(),
      scale: new Vector3(0.9 + random() * 0.8, 0.45 + random() * 0.35, 0.9 + random() * 0.8),
    });
  }
  return bushes;
}

function layoutMushrooms(random: () => number): {
  stems: InstanceTransform[];
  caps: InstanceTransform[];
  capColors: number[];
} {
  const stems: InstanceTransform[] = [];
  const caps: InstanceTransform[] = [];
  const capColors: number[] = [];
  const colors = [0xc45c6a, 0xd98a4a, 0xb14d7a];
  for (let index = 0; index < 16; index += 1) {
    const angle = random() * Math.PI * 2;
    const radius = 7.5 + random() * 6;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    stems.push({
      position: new Vector3(x, 0.08, z),
      quaternion: new Quaternion(),
      scale: new Vector3(1, 1, 1),
    });
    caps.push({
      position: new Vector3(x, 0.2, z),
      quaternion: new Quaternion(),
      scale: new Vector3(1.1, 0.55, 1.1),
    });
    capColors.push(colors[index % colors.length] ?? 0xc45c6a);
  }
  return { stems, caps, capColors };
}

function layoutBoundaryStones(): InstanceTransform[] {
  const stones: InstanceTransform[] = [];
  const count = 28;
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2;
    stones.push({
      position: new Vector3(
        Math.cos(angle) * ARENA_HALF_EXTENT,
        0.08,
        Math.sin(angle) * ARENA_HALF_EXTENT,
      ),
      quaternion: new Quaternion(),
      scale: new Vector3(1.1, 0.55, 0.9),
    });
  }
  return stones;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let result = Math.imul(t ^ (t >>> 15), 1 | t);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}
