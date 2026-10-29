# Architecture

Technical architecture for Bernardo vs. The Undead: Rise of the Siren King.

This document describes the architecture **as implemented**, and marks remaining systems as planned.

Related decisions: `docs/decisions/`.

## 1. Current Runtime Reality

Phase 1 is implemented: a Vite + TypeScript + Three.js bootstrap with a testable fixed-timestep loop, a minimal isometric scene, unit tests, and GitHub Actions.

| Item                                     | Status          |
| ---------------------------------------- | --------------- |
| `index.html` → `src/main.ts`             | Implemented     |
| `Game` session                           | Implemented     |
| `GameLoop`                               | Implemented     |
| `GameRenderer` + bootstrap scene         | Implemented     |
| WebGL2 failure UI                        | Implemented     |
| Vitest, ESLint, Prettier                 | Implemented     |
| GitHub Actions CI                        | Implemented     |
| Gameplay systems, input, entities, audio | Not implemented |

Do not create empty folders to match a future tree. Add modules when a milestone needs them.

## 2. Design Goals

1. Gameplay rules stay testable without WebGL.
2. Rendering, input, audio, and UI are replaceable adapters around simulation state.
3. Large skeleton crowds remain feasible through simple simulation and cheap rendering.
4. Placeholder art can be replaced without rewriting systems.
5. Modules appear when a milestone needs them, not as speculative infrastructure.

## 3. Module Boundaries

Implemented:

```text
src/
  main.ts                         Browser entry and boot-error handling
  core/
    Game.ts                       Session: owns loop + renderer
    GameLoop.ts                   Fixed-timestep loop
  rendering/
    GameRenderer.ts               WebGLRenderer, resize, dispose
    createBootstrapScene.ts       Ground, lights, marker, isometric camera
    webgl.ts                      WebGL2 detection and init errors
  style.css
```

Intended later, still absent:

```text
src/
  config/                         Typed gameplay data
  types/                          Shared types
  systems/                        Movement, combat, collision, spawn, progression
  entities/                       Player, enemies, bosses as data
  abilities/
  world/
  input/
  audio/
  ui/
```

| Area           | Responsibility                                         | Status                         |
| -------------- | ------------------------------------------------------ | ------------------------------ |
| `core`         | Session lifecycle, fixed-timestep loop, pause, dispose | Implemented                    |
| `rendering`    | Bootstrap scene, camera, lights, resize, GPU dispose   | Implemented (placeholder only) |
| `systems`      | Movement, combat, collision, spawn, progression        | Planned                        |
| `entities`     | Typed game objects, not Three.js meshes                | Planned                        |
| `input`        | Keyboard now, touch later                              | Planned                        |
| `config`       | Enemy, ability, and balance data                       | Planned                        |
| `audio`        | Howler adapter                                         | Planned, Phase 5               |
| `ui`           | DOM overlay beyond boot errors                         | Planned                        |
| Physics engine | Rapier, only if simplified collision is insufficient   | Deferred; see ADR 0005         |

## 4. Runtime Lifecycle

Implemented browser lifecycle:

1. `index.html` loads `/src/main.ts`.
2. `boot()` locates `#game-canvas`. If WebGL2 or renderer setup fails, `#boot-error` is shown and the canvas is hidden.
3. `Game` constructs `GameRenderer` and `GameLoop`.
4. `Game.start()` starts the animation frame loop.
5. `pagehide` disposes the session once.

Each frame:

1. `GameLoop` accumulates elapsed time.
2. While enough time remains, `update(1 / 60)` runs (currently elapsed-time only).
3. `render(interpolationAlpha)` draws the Three.js scene.
4. Pause skips `update` and keeps rendering.

There is no scene manager, input manager, or gameplay state machine yet.

Planned later session states:

`boot` → `playing` → `paused` | `levelUp` → `playing` → `gameOver` | `victory`

## 5. Game Loop

`GameLoop` is implemented in `src/core/GameLoop.ts`.

- Variable render cadence from a frame scheduler (`requestAnimationFrame` in the browser).
- Fixed simulation step: `FIXED_TIMESTEP_SECONDS = 1 / 60`.
- Accumulator with `MAX_SIMULATION_STEPS_PER_FRAME = 5` to prevent a spiral of death.
- After hitting the catch-up cap, leftover accumulated time is dropped.
- `start()` is idempotent and will not stack animation frames.
- `pause()` / `resume()` skip or restore simulation without creating a second loop.
- `stop()` cancels the scheduled frame and returns to `idle`.
- `dispose()` cancels the frame and rejects later `start()` calls.

Clock and scheduler are injectable, so tests drive the loop without `requestAnimationFrame` or wall-clock time.

This split is recorded in `docs/decisions/0003-simulation-render-separation.md`.

## 6. State Ownership

| State                            | Owner          | Notes                                   |
| -------------------------------- | -------------- | --------------------------------------- |
| Elapsed simulation time          | `Game`         | Phase 1 only; drives marker rotation    |
| Loop status                      | `GameLoop`     | `idle`, `running`, `paused`, `disposed` |
| Meshes, materials, camera        | `GameRenderer` | Placeholder bootstrap scene             |
| Input intent                     | —              | Not implemented                         |
| World snapshot (health, enemies) | —              | Not implemented                         |
| Balance numbers                  | —              | Not implemented                         |

Do not store authoritative gameplay state on `Object3D.userData`.

## 7. Entity Management

No gameplay entities exist yet.

Planned for the first playable slice: player, Skeleton Warrior, arena bounds.

## 8. Input Flow

Not implemented. Planned:

```text
Keyboard / future touch
        ↓
   InputManager
        ↓
  InputIntent { moveX, moveZ, pause, uiSelection }
        ↓
   Simulation systems
```

## 9. Collision and Physics

Not implemented. Planned: simplified XZ-plane shapes owned by the simulation. Rapier is not a Phase 1 dependency.

See `docs/decisions/0005-simplified-collision-before-rapier.md`.

## 10. Rendering

Implemented renderer responsibilities:

- Own the `WebGLRenderer`, scene, isometric `PerspectiveCamera`, lights, and window resize handling.
- Require WebGL2; throw `WebGLInitError` otherwise.
- Draw a ground plane, ambient light, directional light, and a yellow icosahedron.
- Rotate the marker from simulation elapsed time (visual proof of the loop, not gameplay).
- Dispose geometries, materials, the renderer, and the resize listener.

The camera sits at `(14, 14, 14)` looking at the origin. It does not follow an entity yet.

Instancing, animation mixers, and GLB loading are not implemented.

See `docs/decisions/0004-incremental-asset-integration.md`.

## 11. Asset Loading

No production asset pipeline exists yet. The bootstrap scene is procedural.

## 12. Audio and UI

- Audio is not implemented.
- UI is a full-viewport canvas plus a hidden boot-error message. There is no HUD.
- No event bus. Do not add one until combat, UI, and audio need decoupling.

## 13. Persistence

Not implemented. No server, no accounts.

## 14. Testing Strategy

| Layer       | Tool                    | What exists now                                             |
| ----------- | ----------------------- | ----------------------------------------------------------- |
| Unit        | Vitest                  | `GameLoop` lifecycle, timestep, catch-up cap, WebGL2 helper |
| Integration | Vitest                  | Not yet                                                     |
| E2E         | Playwright              | Not installed                                               |
| Quality     | `tsc`, ESLint, Prettier | Configured                                                  |
| Build       | Vite                    | `npm run build`                                             |

`GameLoop` tests inject a manual clock and frame scheduler. They must not wait on real wall-clock time.

## 15. Performance Envelope

Targets from the product docs, not measured results:

- 60 FPS on a documented desktop reference machine.
- 200 or more active skeletons where feasible.
- Stable memory across repeated restarts.

The production bundle is dominated by Three.js (currently above Vite's 500 kB chunk warning). That is expected for an unsplit first scene and is not an optimization pass.

`docs/PERFORMANCE.md` remains absent until there are real measurements with enemies on screen.

## 16. Resource Lifecycle

Implemented dispose paths:

| Resource                            | Dispose when                    |
| ----------------------------------- | ------------------------------- |
| Animation frame handle              | `GameLoop.stop()` / `dispose()` |
| Window `resize` listener            | `GameRenderer.dispose()`        |
| Ground and marker geometry/material | `GameRenderer.dispose()`        |
| `WebGLRenderer`                     | `GameRenderer.dispose()`        |
| Session on tab hide                 | `pagehide` in `main.ts`         |

Restarts of a playable run are a later concern. `Game.dispose()` is idempotent.

## 17. CI and Tooling

| Tool           | Version family           | Role                                                                                    |
| -------------- | ------------------------ | --------------------------------------------------------------------------------------- |
| Node.js        | 22 LTS (`.nvmrc`)        | Runtime for tooling                                                                     |
| TypeScript     | 5.9                      | Strict checking. 7.x is not used because `typescript-eslint` currently requires `< 6.1` |
| Vite           | 8                        | Dev server and production bundle                                                        |
| Three.js       | 0.186                    | Rendering. Types come from `@types/three`                                               |
| Vitest         | 5                        | Unit tests                                                                              |
| ESLint         | 10 + typescript-eslint 8 | Lint                                                                                    |
| Prettier       | 3                        | Format                                                                                  |
| GitHub Actions | `ubuntu-latest`, Node 22 | `npm ci`, typecheck, lint, test, build                                                  |

Line endings are LF via `.gitattributes` and `.editorconfig`.

Cloudflare Pages deployment is still planned.

## 18. Next Follow-Up

Phase 2 should add:

- Player movement simulation independent of meshes.
- Keyboard input as an intent object.
- A bounded forest arena and a follow camera.
- Unit tests for movement and bounds, still without WebGL.
