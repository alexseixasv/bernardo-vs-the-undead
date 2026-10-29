import {
  Mesh,
  MeshStandardMaterial,
  OctahedronGeometry,
  type BufferGeometry,
  type Material,
} from 'three';

export interface XpGemAssets {
  createView(): Mesh;
  dispose(): void;
}

export function createXpGemAssets(): XpGemAssets {
  const geometry = new OctahedronGeometry(0.16, 0);
  const material = new MeshStandardMaterial({
    color: 0x5ce1ff,
    emissive: 0x1c6f88,
    roughness: 0.32,
    metalness: 0.18,
  });

  const geometries: BufferGeometry[] = [geometry];
  const materials: Material[] = [material];

  return {
    createView(): Mesh {
      const mesh = new Mesh(geometry, material);
      mesh.name = 'xp-gem';
      return mesh;
    },
    dispose(): void {
      for (const item of geometries) {
        item.dispose();
      }
      for (const item of materials) {
        item.dispose();
      }
    },
  };
}
