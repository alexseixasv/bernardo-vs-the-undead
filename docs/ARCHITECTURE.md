# Architecture

Technical architecture for Bernardo vs. The Undead: Rise of the Siren King.

This document describes the architecture **intended for implementation**. Nothing below is implemented yet except repository documentation and licensing.

**Status:** Proposed. Update this file when a system actually lands, and mark it implemented.

Related decisions: `docs/decisions/`.

## 1. Current Runtime Reality

The repository has no application source, package manifest, bundler, tests, or CI.

Present:

- Product and licensing documentation.
- Planned asset directory at `public/assets/`.
- Git ignore rules for future tooling and private references.

Absent:

- `package.json`, Vite, TypeScript, Three.js, src, tests, GitHub Actions.

Do not read the file tree in `README.md` as an instruction to create empty folders.

## 2. Design Goals

1. Gameplay rules stay testable without WebGL.
2. Rendering, input, audio, and UI are replaceable adapters around simulation state.
3. Large skeleton crowds remain feasible through simple simulation and cheap rendering.
4. Placeholder art can be replaced without rewriting systems.
5. Modules appear when a milestone needs them, not as speculative infrastructure.

## 3. Proposed Module Boundaries

```text
src/
  main.ts                 Bootstraps the browser entry
  core/                   Loop, session lifecycle, events
  config/                 Typed gameplay data
  types/                  Shared types
  systems/                Simulation systems
  entities/               Player, enemies, bosses, projectiles, pickups as data
  abilities/              Ability definitions and runtime behavior
  world/                  Arena bounds, spawn points, environment collision
  rendering/              Three.js views, cameras, instancing, animation mixers
  input/                  Device input -> movement/UI intent
  audio/                  Sound playback adapter
  ui/                     HTML/CSS HUD and menus
```

| Area | Responsibility | Status |
|---|---|---|
| `core` | Session lifecycle, fixed-timestep loop, pause, dispose | Planned |
| `systems` | Movement, combat, collision, spawn, progression | Planned |
| `entities` | Typed game objects, not Three.js meshes | Planned |
| `rendering` | Scene graph, camera, meshes, effects | Planned |
| `input` | Keyboard now, touch later | Planned |
| `config` | Enemy, ability, and balance data | Planned |
| `audio` | Howler adapter | Planned, Phase 5 |
| `ui` | DOM overlay | Planned |
| Physics engine | Rapier, only if simplified collision is insufficient | Deferred; see ADR 0005 |

## 4. Runtime Lifecycle

Planned browser lifecycle:

1. `main.ts` creates a canvas, renderer, and `Game` session.
2. `Game` loads the current scene (initially a single playable arena).
3. `GameLoop` starts `requestAnimationFrame`.
4. Each frame: read input, step simulation at a fixed timestep, render, update DOM UI.
5. Pause, level-up, victory, and defeat stop or gate simulation while rendering and UI may continue.
6. Restart disposes GPU objects, listeners, timers, and pools, then constructs a new session.

Planned session states:

`boot` → `playing` → `paused` | `levelUp` → `playing` → `gameOver` | `victory`

A dedicated scene manager is **not** required for the first slice. Introduce it when menus and gameplay become separate scenes.

## 5. Game Loop

Simulation and rendering must not share a single unpaced `deltaTime` for gameplay rules.

Planned loop:

- Variable render frame from `requestAnimationFrame`.
- Accumulator feeding a fixed simulation step, initially `1 / 60` seconds.
- Simulation consumes input intent and produces a new world snapshot.
- Rendering reads the snapshot and does not mutate gameplay rules.
- Pause and level-up skip simulation steps.

Unit tests should be able to call `simulation.step(dt)` without a renderer.

This split is recorded in `docs/decisions/0003-simulation-render-separation.md`.

## 6. State Ownership

| State | Owner | Notes |
|---|---|---|
| World snapshot (positions, health, timers) | Simulation / session | Source of truth |
| Input intent (move vector, pause request) | Input adapter | Rebuilt each frame from devices |
| Meshes, materials, mixers | Renderer | Views of simulation entities |
| HUD values | UI adapter | Reads simulation; writes only UI commands |
| Balance numbers | `src/config/` | Data, not scattered literals |

Entities are plain typed objects with numeric ids. Systems iterate collections. This is composition of data and systems, not a full ECS.

Do not store authoritative health, cooldowns, or AI state on `Object3D.userData`.

## 7. Entity Management

Planned entities for the first playable slice:

- Player
- Skeleton Warrior
- Arena bounds

Later entities:

- Additional skeleton types
- Projectiles
- Experience crystals
- Ability effects
- Siren King

When enemy counts grow, reuse instances through object pools. Do not add pooling before a spawn system exists.

## 8. Input Flow

```text
Keyboard / future touch
        ↓
   InputManager
        ↓
  InputIntent { moveX, moveZ, pause, uiSelection }
        ↓
   Simulation systems
```

The simulation must not read `KeyboardEvent` directly. That keeps movement tests deterministic and allows touch later without rewriting combat.

## 9. Collision and Physics

Initial collision is simplified and gameplay-owned:

- Movement on the XZ plane, Y-up (Three.js default).
- Circle or AABB bounds for the player, skeletons, pickups, and arena edges.
- No rigid-body skeleton army.

Rapier remains an allowed dependency when a milestone needs real 3D physics that this model cannot provide. It is not part of the Phase 1 foundation.

See `docs/decisions/0005-simplified-collision-before-rapier.md`.

## 10. Rendering

Planned renderer responsibilities:

- Own the WebGLRenderer, scene, camera, lights, and resize handling.
- Create, update, and dispose geometries, materials, textures, and mixers.
- Follow the player with an isometric camera.
- Use shared geometries/materials early; use `InstancedMesh` when many skeletons share a mesh.
- Map entity id → view object without leaking that map into gameplay.

Placeholder implementation: procedural meshes (for example a capsule or simple figure for Bernardo, a stripped skeleton-like shape for warriors, a ground plane and a few trees for the forest).

Final implementation: GLB models loaded through an asset catalog. Gameplay continues to see radius, height, and animation state names, not node names from Blender.

See `docs/decisions/0004-incremental-asset-integration.md`.

## 11. Asset Loading

Planned catalog approach:

```text
AssetId → { url, license, kind, animationClips? }
```

- Place files under `public/assets/` following `public/assets/README.md`.
- Load through Three.js loaders behind an `AssetLoader` adapter.
- Keep fallbacks so a missing GLB can use a procedural placeholder in development.
- Dispose GPU resources on session teardown.

No production asset pipeline exists yet.

## 12. Audio and UI

- Audio is a later adapter around Howler.js. Simulation emits events such as `enemyDied`; audio reacts.
- UI is HTML and CSS over the canvas. The canvas does not own menus.
- A small typed event bus is optional and should be introduced when combat, UI, and audio need decoupling. Do not add it in Phase 1.

## 13. Persistence

Not in the first playable versions. If local saves or settings appear, use IndexedDB behind a persistence adapter. No server, no accounts.

## 14. Testing Strategy

| Layer | Tool | What to test |
|---|---|---|
| Unit | Vitest | Movement, damage, health, cooldowns, spawn rules, progression, boss phases |
| Integration | Vitest | Combat plus health, spawn plus difficulty, XP plus level-up |
| E2E | Playwright | Boot, start run, move, pause, game over, restart |
| Quality | `tsc`, ESLint, Prettier | Types, style |
| Build | Vite | Production bundle |

Playwright starts when a browser-visible scene exists. Do not rely on screenshot diffs as the primary assertion.

Debug overlays must be stripped or disabled in production builds.

## 15. Performance Envelope

Targets from the product docs, not measured results:

- 60 FPS on a documented desktop reference machine.
- 200 or more active skeletons where feasible.
- Stable memory across repeated restarts.

Primary levers: pooling, instancing, spatial hashing for nearby queries, cheap AI, shared materials, and simplified collision.

Record real measurements in `docs/PERFORMANCE.md` when they exist. That file is intentionally absent until there is a runnable scene.

## 16. Resource Lifecycle

Every allocator needs a matching dispose path:

| Resource | Dispose when |
|---|---|
| Event listeners | Session end, scene change |
| rAF loop | Pause destroy / page unload |
| Three.js geometries, materials, textures, mixers | Entity despawn and session end |
| Instanced mesh slots | Enemy return to pool |
| Audio instances | Scene end |
| Worker / WASM physics | Only if Rapier is later adopted |

Restarts must not leak memory. This is an acceptance concern starting with the first scene, not only polish.

## 17. CI and Deployment

Planned:

- GitHub Actions: typecheck, lint, unit tests, production build. E2E when Playwright exists.
- Cloudflare Pages for the static Vite output.

Neither pipeline exists yet.

## 18. Follow-Up When Implementation Starts

Phase 1 should replace this "proposed" status with:

- Exact package versions.
- The real entry module path.
- The implemented loop class names.
- What is still unimplemented.
