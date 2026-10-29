import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PointLight,
  SphereGeometry,
  type BufferGeometry,
  type Material,
} from 'three';

import type { BernardoAnim } from './characterPose';

export interface BernardoPlaceholder {
  group: Group;
  fillLight: PointLight;
  sync(anim: BernardoAnim, hurtAmount: number, deltaSeconds: number): void;
  resetPose(): void;
  dispose(): void;
}

export function createBernardoPlaceholder(): BernardoPlaceholder {
  const group = new Group();
  group.name = 'bernardo-placeholder';

  const skin = new MeshStandardMaterial({ color: 0xffd4a3, roughness: 0.48, metalness: 0.02 });
  const hair = new MeshStandardMaterial({ color: 0x241610, roughness: 0.88, metalness: 0 });
  const shirt = new MeshStandardMaterial({
    color: 0xffe34d,
    emissive: 0x6a4e00,
    roughness: 0.4,
    metalness: 0.04,
  });
  const stripe = new MeshStandardMaterial({
    color: 0xfff6c8,
    emissive: 0x3a3208,
    roughness: 0.45,
    metalness: 0.03,
  });
  const shorts = new MeshStandardMaterial({
    color: 0x3a78ff,
    emissive: 0x10285a,
    roughness: 0.46,
    metalness: 0.04,
  });
  const shoe = new MeshStandardMaterial({ color: 0x3a2a22, roughness: 0.7, metalness: 0 });
  const eye = new MeshStandardMaterial({ color: 0x1a1410, roughness: 0.35, metalness: 0 });
  const blush = new MeshStandardMaterial({
    color: 0xf4a39a,
    roughness: 0.6,
    metalness: 0,
    transparent: true,
    opacity: 0.55,
  });

  const geometries: BufferGeometry[] = [];
  const materials: Material[] = [skin, hair, shirt, stripe, shorts, shoe, eye, blush];

  const body = new Group();
  body.name = 'bernardo-body';
  group.add(body);

  const add = (
    parent: Group,
    geometry: BufferGeometry,
    material: Material,
    x: number,
    y: number,
    z: number,
  ): Mesh => {
    geometries.push(geometry);
    const mesh = new Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };

  const head = new Group();
  head.position.set(0, 1.22, 0);
  body.add(head);
  add(head, new SphereGeometry(0.3, 12, 10), skin, 0, 0, 0.02);
  const hairCap = add(head, new SphereGeometry(0.32, 12, 10), hair, 0, 0.1, -0.04);
  hairCap.scale.set(1.08, 0.7, 1.1);
  add(head, new SphereGeometry(0.12, 8, 6), hair, 0.16, 0.08, 0.08);
  add(head, new SphereGeometry(0.12, 8, 6), hair, -0.16, 0.08, 0.08);
  add(head, new SphereGeometry(0.07, 6, 5), hair, 0, 0.02, -0.24);
  add(head, new SphereGeometry(0.05, 8, 6), eye, -0.09, 0.02, 0.24);
  add(head, new SphereGeometry(0.05, 8, 6), eye, 0.09, 0.02, 0.24);
  add(head, new SphereGeometry(0.045, 6, 5), blush, -0.16, -0.06, 0.18);
  add(head, new SphereGeometry(0.045, 6, 5), blush, 0.16, -0.06, 0.18);
  add(head, new BoxGeometry(0.09, 0.025, 0.04), hair, 0, -0.12, 0.26);

  add(body, new BoxGeometry(0.46, 0.44, 0.3), shirt, 0, 0.8, 0);
  add(body, new BoxGeometry(0.48, 0.08, 0.32), stripe, 0, 0.66, 0.01);
  add(body, new BoxGeometry(0.5, 0.24, 0.32), shorts, 0, 0.5, 0);

  const leftArm = new Group();
  leftArm.position.set(-0.3, 0.9, 0);
  body.add(leftArm);
  add(leftArm, new BoxGeometry(0.11, 0.38, 0.11), skin, 0, -0.16, 0);

  const rightArm = new Group();
  rightArm.position.set(0.3, 0.9, 0);
  body.add(rightArm);
  add(rightArm, new BoxGeometry(0.11, 0.38, 0.11), skin, 0, -0.16, 0);

  const leftLeg = new Group();
  leftLeg.position.set(-0.13, 0.4, 0);
  body.add(leftLeg);
  add(leftLeg, new BoxGeometry(0.13, 0.32, 0.15), skin, 0, -0.14, 0);
  add(leftLeg, new BoxGeometry(0.15, 0.08, 0.22), shoe, 0, -0.32, 0.03);

  const rightLeg = new Group();
  rightLeg.position.set(0.13, 0.4, 0);
  body.add(rightLeg);
  add(rightLeg, new BoxGeometry(0.13, 0.32, 0.15), skin, 0, -0.14, 0);
  add(rightLeg, new BoxGeometry(0.15, 0.08, 0.22), shoe, 0, -0.32, 0.03);

  const fillLight = new PointLight(0xfff3c8, 2.5, 8, 2);
  fillLight.position.set(0, 1.3, 0.6);
  group.add(fillLight);

  let phase = 0;

  const resetPose = (): void => {
    body.position.set(0, 0, 0);
    body.rotation.set(0, 0, 0);
    head.rotation.set(0, 0, 0);
    leftArm.rotation.set(0, 0, 0);
    rightArm.rotation.set(0, 0, 0);
    leftLeg.rotation.set(0, 0, 0);
    rightLeg.rotation.set(0, 0, 0);
    group.scale.setScalar(1);
  };

  return {
    group,
    fillLight,
    sync(anim, hurtAmount, deltaSeconds): void {
      phase += deltaSeconds;
      resetPose();

      if (anim === 'defeat') {
        body.rotation.x = 1.15;
        body.position.y = -0.18;
        leftArm.rotation.x = -0.5;
        rightArm.rotation.x = 0.4;
        return;
      }

      if (anim === 'hurt') {
        const shake = Math.sin(phase * 42) * 0.14 * hurtAmount;
        body.rotation.z = shake;
        head.rotation.z = shake * 0.6;
        group.scale.setScalar(1 + hurtAmount * 0.08);
        return;
      }

      if (anim === 'walk') {
        const swing = Math.sin(phase * 9) * 0.55;
        leftArm.rotation.x = swing;
        rightArm.rotation.x = -swing;
        leftLeg.rotation.x = -swing;
        rightLeg.rotation.x = swing;
        body.position.y = Math.abs(Math.sin(phase * 9)) * 0.045;
        head.rotation.x = Math.sin(phase * 9) * 0.04;
        return;
      }

      const bob = Math.sin(phase * 2.1) * 0.025;
      body.position.y = bob;
      leftArm.rotation.z = 0.08 + bob;
      rightArm.rotation.z = -0.08 - bob;
    },
    resetPose,
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
