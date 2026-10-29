import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  type BufferGeometry,
  type Material,
} from 'three';

export interface SkeletonAssets {
  createView(): Group;
  dispose(): void;
}

export function createSkeletonAssets(): SkeletonAssets {
  const bone = new MeshStandardMaterial({
    color: 0xf6ecd6,
    emissive: 0x3a3428,
    roughness: 0.48,
    metalness: 0.05,
  });
  const socket = new MeshStandardMaterial({
    color: 0x1a1412,
    roughness: 0.7,
    metalness: 0,
  });

  const skull = new SphereGeometry(0.22, 10, 8);
  const jaw = new BoxGeometry(0.16, 0.06, 0.12);
  const rib = new BoxGeometry(0.32, 0.28, 0.16);
  const pelvis = new BoxGeometry(0.26, 0.1, 0.16);
  const boneArm = new CylinderGeometry(0.035, 0.04, 0.42, 6);
  const boneLeg = new CylinderGeometry(0.045, 0.05, 0.5, 6);
  const eye = new SphereGeometry(0.05, 8, 6);

  const geometries: BufferGeometry[] = [skull, jaw, rib, pelvis, boneArm, boneLeg, eye];
  const materials: Material[] = [bone, socket];

  return {
    createView(): Group {
      const group = new Group();
      group.name = 'skeleton-warrior';

      const add = (
        geometry: BufferGeometry,
        material: Material,
        x: number,
        y: number,
        z: number,
      ): Mesh => {
        const mesh = new Mesh(geometry, material);
        mesh.position.set(x, y, z);
        group.add(mesh);
        return mesh;
      };

      add(skull, bone, 0, 1.32, 0);
      add(jaw, bone, 0, 1.14, 0.06);
      add(eye, socket, -0.07, 1.34, 0.16);
      add(eye, socket, 0.07, 1.34, 0.16);
      add(rib, bone, 0, 0.88, 0);
      add(pelvis, bone, 0, 0.64, 0);
      add(boneArm, bone, -0.24, 0.86, 0);
      add(boneArm, bone, 0.24, 0.86, 0);
      add(boneLeg, bone, -0.09, 0.32, 0);
      add(boneLeg, bone, 0.09, 0.32, 0);
      return group;
    },
    dispose(): void {
      for (const geometry of geometries) {
        geometry.dispose();
      }
      for (const material of materials) {
        material.dispose();
      }
    },
  };
}
