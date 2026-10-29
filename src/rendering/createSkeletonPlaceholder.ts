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

import type { SkeletonAnim } from './characterPose';

export interface SkeletonView {
  group: Group;
  sync(
    anim: SkeletonAnim,
    hitAmount: number,
    deathAmount: number,
    deltaSeconds: number,
    phaseOffset: number,
  ): void;
}

export interface SkeletonAssets {
  createView(): SkeletonView;
  dispose(): void;
}

export function createSkeletonAssets(): SkeletonAssets {
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

  const geometries: BufferGeometry[] = [
    skull,
    jaw,
    cheek,
    ribWide,
    spine,
    pelvis,
    boneArm,
    boneLeg,
    hand,
    foot,
    eye,
  ];
  const materials: Material[] = [bone, socket];

  return {
    createView(): SkeletonView {
      const group = new Group();
      group.name = 'skeleton-warrior';
      const body = new Group();
      group.add(body);

      const add = (
        parent: Group,
        geometry: BufferGeometry,
        material: Material,
        x: number,
        y: number,
        z: number,
      ): Mesh => {
        const mesh = new Mesh(geometry, material);
        mesh.position.set(x, y, z);
        parent.add(mesh);
        return mesh;
      };

      const head = new Group();
      head.position.set(0, 1.34, 0);
      body.add(head);
      add(head, skull, bone, 0, 0, 0);
      add(head, jaw, bone, 0, -0.18, 0.05);
      add(head, cheek, bone, -0.14, -0.04, 0.08);
      add(head, cheek, bone, 0.14, -0.04, 0.08);
      add(head, eye, socket, -0.07, 0.04, 0.16);
      add(head, eye, socket, 0.07, 0.04, 0.16);

      add(body, spine, bone, 0, 0.92, 0);
      add(body, ribWide, bone, 0, 1.08, 0.02);
      add(body, ribWide, bone, 0, 0.96, 0.02);
      add(body, ribWide, bone, 0, 0.84, 0.02);
      add(body, pelvis, bone, 0, 0.64, 0);

      const leftArm = new Group();
      leftArm.position.set(-0.26, 1.06, 0);
      body.add(leftArm);
      add(leftArm, boneArm, bone, 0, -0.18, 0);
      add(leftArm, hand, bone, 0, -0.4, 0.02);

      const rightArm = new Group();
      rightArm.position.set(0.26, 1.06, 0);
      body.add(rightArm);
      add(rightArm, boneArm, bone, 0, -0.18, 0);
      add(rightArm, hand, bone, 0, -0.4, 0.02);

      const leftLeg = new Group();
      leftLeg.position.set(-0.1, 0.58, 0);
      body.add(leftLeg);
      add(leftLeg, boneLeg, bone, 0, -0.22, 0);
      add(leftLeg, foot, bone, 0, -0.48, 0.04);

      const rightLeg = new Group();
      rightLeg.position.set(0.1, 0.58, 0);
      body.add(rightLeg);
      add(rightLeg, boneLeg, bone, 0, -0.22, 0);
      add(rightLeg, foot, bone, 0, -0.48, 0.04);

      let phase = 0;

      return {
        group,
        sync(anim, hitAmount, deathAmount, deltaSeconds, phaseOffset): void {
          phase += deltaSeconds;
          body.position.set(0, 0, 0);
          body.rotation.set(0, 0, 0);
          leftArm.rotation.set(0, 0, 0.15);
          rightArm.rotation.set(0, 0, -0.15);
          leftLeg.rotation.set(0, 0, 0);
          rightLeg.rotation.set(0, 0, 0);
          group.scale.setScalar(1);

          if (anim === 'death') {
            const amount = Math.min(1, deathAmount);
            body.rotation.x = amount * 1.35;
            body.position.y = -amount * 0.2;
            group.scale.setScalar(Math.max(0.08, 1 - amount * 0.35));
            return;
          }

          if (anim === 'hit') {
            group.scale.setScalar(1 + hitAmount * 0.2);
            body.rotation.z = Math.sin((phase + phaseOffset) * 40) * 0.18 * hitAmount;
            return;
          }

          const time = phase * 8 + phaseOffset;
          if (anim === 'contact') {
            rightArm.rotation.x = -0.9 + Math.sin(time * 1.6) * 0.25;
            leftArm.rotation.x = 0.2;
            return;
          }

          if (anim === 'walk') {
            const swing = Math.sin(time) * 0.6;
            leftArm.rotation.x = swing;
            rightArm.rotation.x = -swing;
            leftLeg.rotation.x = -swing;
            rightLeg.rotation.x = swing;
            body.position.y = Math.abs(Math.sin(time)) * 0.04;
            return;
          }

          const idle = Math.sin(phase * 2 + phaseOffset) * 0.03;
          body.position.y = idle;
          leftArm.rotation.z = 0.18 + idle;
          rightArm.rotation.z = -0.18 - idle;
        },
      };
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
