# ADR 0003: Separate gameplay simulation from rendering

- Status: Accepted
- Date: 2026-10-29

## Context

Combat, movement, spawning, and progression must be unit-tested without WebGL. A browser game also needs a stable simulation rate so cooldowns and enemy behavior do not depend on frame rate.

Putting rules on Three.js objects would make tests slow, brittle, and coupled to mesh structure.

## Decision

Own gameplay state in simulation modules updated on a fixed timestep. Treat Three.js as a view that reads that state and disposes GPU resources.

Input devices produce an intent object. Systems consume the intent. Rendering and HTML UI must not author health, damage, or spawn rules.

## Alternatives considered

- **Logic inside `Object3D` / `userData`:** convenient, hard to test, easy to leak GPU objects into rules.
- **Variable-delta gameplay updates only:** simpler loop, unstable cooldowns under hitching.
- **Full ECS framework:** extra abstraction before entity complexity justifies it.

## Consequences

- Tests can step the world without creating a renderer.
- A mapping layer between entity ids and meshes is required.
- Pause and level-up can skip simulation while still rendering menus.
- Contributors must not add gameplay constants inside rendering code.
