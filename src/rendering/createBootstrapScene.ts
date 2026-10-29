import {
  AmbientLight,
  Color,
  DirectionalLight,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
} from 'three';

export interface BootstrapScene {
  scene: Scene;
  camera: PerspectiveCamera;
  marker: Mesh;
  dispose(): void;
}

export function createBootstrapScene(aspect: number): BootstrapScene {
  const scene = new Scene();
  scene.background = new Color(0x0b1220);

  const camera = new PerspectiveCamera(35, aspect, 0.1, 200);
  camera.position.set(14, 14, 14);
  camera.lookAt(0, 0, 0);

  const ambient = new AmbientLight(0xb8c6e0, 0.5);
  const sun = new DirectionalLight(0xffe6c2, 1.15);
  sun.position.set(10, 16, 8);
  scene.add(ambient, sun);

  const groundGeometry = new PlaneGeometry(24, 24);
  const groundMaterial = new MeshStandardMaterial({
    color: 0x2f4a34,
    roughness: 0.92,
    metalness: 0.04,
  });
  const ground = new Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const markerGeometry = new IcosahedronGeometry(0.8, 0);
  const markerMaterial = new MeshStandardMaterial({
    color: 0xf5d76e,
    roughness: 0.35,
    metalness: 0.08,
  });
  const marker = new Mesh(markerGeometry, markerMaterial);
  marker.position.y = 0.8;
  scene.add(marker);

  return {
    scene,
    camera,
    marker,
    dispose(): void {
      groundGeometry.dispose();
      groundMaterial.dispose();
      markerGeometry.dispose();
      markerMaterial.dispose();
    },
  };
}
