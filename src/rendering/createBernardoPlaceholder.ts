import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  type BufferGeometry,
  type Material,
} from 'three';

export interface BernardoPlaceholder {
  group: Group;
  dispose(): void;
}

export function createBernardoPlaceholder(): BernardoPlaceholder {
  const group = new Group();
  group.name = 'bernardo-placeholder';

  const skin = new MeshStandardMaterial({ color: 0xf1c27d, roughness: 0.55, metalness: 0.02 });
  const hair = new MeshStandardMaterial({ color: 0x2a1c16, roughness: 0.85, metalness: 0 });
  const shirt = new MeshStandardMaterial({ color: 0xf5d56a, roughness: 0.5, metalness: 0.04 });
  const shorts = new MeshStandardMaterial({ color: 0x2f5ea8, roughness: 0.55, metalness: 0.04 });
  const shoe = new MeshStandardMaterial({ color: 0x3a2a22, roughness: 0.7, metalness: 0 });
  const eye = new MeshStandardMaterial({ color: 0x1a1410, roughness: 0.4, metalness: 0 });

  const geometries: BufferGeometry[] = [];
  const materials: Material[] = [skin, hair, shirt, shorts, shoe, eye];

  const add = (
    geometry: BufferGeometry,
    material: Material,
    x: number,
    y: number,
    z: number,
  ): Mesh => {
    geometries.push(geometry);
    const mesh = new Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    group.add(mesh);
    return mesh;
  };

  add(new SphereGeometry(0.28, 12, 10), skin, 0, 1.18, 0);
  const hairMesh = add(new SphereGeometry(0.3, 12, 10), hair, 0, 1.3, -0.04);
  hairMesh.scale.set(1.05, 0.72, 1.08);

  add(new BoxGeometry(0.42, 0.42, 0.28), shirt, 0, 0.78, 0);
  add(new BoxGeometry(0.46, 0.22, 0.3), shorts, 0, 0.5, 0);

  add(new BoxGeometry(0.1, 0.34, 0.1), skin, -0.28, 0.72, 0);
  add(new BoxGeometry(0.1, 0.34, 0.1), skin, 0.28, 0.72, 0);

  add(new BoxGeometry(0.12, 0.32, 0.14), skin, -0.12, 0.24, 0);
  add(new BoxGeometry(0.12, 0.32, 0.14), skin, 0.12, 0.24, 0);
  add(new BoxGeometry(0.14, 0.08, 0.2), shoe, -0.12, 0.06, 0.02);
  add(new BoxGeometry(0.14, 0.08, 0.2), shoe, 0.12, 0.06, 0.02);

  add(new SphereGeometry(0.045, 8, 8), eye, -0.09, 1.2, 0.22);
  add(new SphereGeometry(0.045, 8, 8), eye, 0.09, 1.2, 0.22);

  return {
    group,
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
