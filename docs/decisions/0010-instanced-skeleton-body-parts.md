# ADR 0010: Instance skeleton body parts, not whole characters

- Status: Accepted
- Date: 2026-10-29

## Context

Phase 5 measured about 19–20 WebGL draws per Skeleton Warrior because each limb was a separate `Mesh`. At 50 enemies that was ~983 draws. A single `InstancedMesh` per character cannot swing different arms and legs through ordinary per-object transforms.

## Decision

Merge rigid sub-parts (torso, head, each limb, each eye socket) into eight shared geometries. Drive one `InstancedMesh` per part. Per-enemy animation writes a world matrix into that enemy's instance slot. A dense slot pool maps stable enemy ids onto instance indices and swap-removes on death.

Procedural pose math stays in `skeletonPartPose.ts` and is independent of WebGL.

## Alternatives considered

- **One instanced character mesh:** lowest draw count, no per-enemy walk cycle.
- **Keep per-enemy `Group` meshes:** already measured as the bottleneck.
- **Custom bone shaders:** more code than the current horde size justifies.
- **Spatial hashing for targeting:** simulation was 0.4 ms at 200 enemies; not the limiter.

## Consequences

- Draw count for the horde is effectively constant (~8 skeleton draws plus the forest, Bernardo, and VFX).
- Capacity is 256 instance slots. Production still caps at 14 living warriors.
- Hit flash uses per-instance color. Death linger reuses the same slot, then releases it.
