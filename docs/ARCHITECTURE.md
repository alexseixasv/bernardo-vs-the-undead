# Architecture

Technical architecture for Bernardo vs. The Undead: Rise of the Siren King.

This document describes the architecture **as implemented**, and marks remaining systems as planned.

Related decisions: `docs/decisions/`.

## 1. Current Runtime Reality

Phase 2 is implemented: a testable movement prototype in a procedural forest, with keyboard intent, arena bounds, and an isometric follow camera.

| Item                                     | Status          |
| ---------------------------------------- | --------------- |
| `index.html` → `src/main.ts`             | Implemented     |
| `Game` session                           | Implemented     |
| `GameLoop`                               | Implemented     |
| Forest arena + Bernardo placeholder      | Implemented     |
| Keyboard `InputIntent` + movement        | Implemented     |
| Isometric follow camera                  | Implemented     |
| WebGL2 failure UI                        | Implemented     |
| Vitest, ESLint, Prettier, GitHub Actions | Implemented     |
| Combat, enemies, abilities, audio        | Not implemented |

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
  main.ts                              Browser entry and boot-error handling
  core/
    Game.ts                            Session: owns loop, world, input, renderer
    GameLoop.ts                        Fixed-timestep loop
  config/world.ts                      Speed, arena bounds, camera, isometric basis
  entities/player.ts                   Player simulation state
  input/
    InputIntent.ts                     Screen-space movement axes
    isometric.ts                       Screen → XZ mapping
    keyboardState.ts                   Pure keyboard reducer
    KeyboardInput.ts                   DOM listeners
  systems/MovementSystem.ts            Speed, facing, arena clamp
  world/World.ts                       Previous/current player snapshots
  rendering/
    GameRenderer.ts                    WebGLRenderer, resize, compose views
    createForestArena.ts               Procedural forest
    createBernardoPlaceholder.ts       Stylized placeholder mesh
    cameraFollow.ts                    Smooth isometric follow
    webgl.ts                           WebGL2 detection
  style.css
```

Intended later, still absent:

```text
src/
  types/
  systems/                             Combat, spawn, progression
  entities/                            Enemies, bosses, projectiles
  abilities/
  audio/
  ui/                                  Full HUD
```

| Area           | Responsibility                                         | Status                 |
| -------------- | ------------------------------------------------------ | ---------------------- |
| `core`         | Session lifecycle, fixed-timestep loop, pause, dispose | Implemented            |
| `rendering`    | Forest, placeholder Bernardo, follow camera, dispose   | Implemented            |
| `systems`      | Movement and arena bounds                              | Implemented            |
| `entities`     | Player data                                            | Implemented            |
| `input`        | Keyboard → `InputIntent`                               | Implemented            |
| `config`       | Movement, camera, and arena values                     | Implemented            |
| `audio`        | Howler adapter                                         | Planned, Phase 5       |
| `ui`           | Controls hint only                                     | Implemented (minimal)  |
| Physics engine | Rapier, only if simplified collision is insufficient   | Deferred; see ADR 0005 |

## 4. Runtime Lifecycle

Implemented browser lifecycle:

1. `index.html` loads `/src/main.ts`.
2. `boot()` locates `#game-canvas`. If WebGL2 or renderer setup fails, `#boot-error` is shown and the canvas is hidden.
3. `Game` constructs `GameRenderer` and `GameLoop`.
4. `Game.start()` starts the animation frame loop.
5. `pagehide` disposes the session once.

Each frame:

1. `GameLoop` accumulates elapsed time.
2. While enough time remains, `World.step(1 / 60, input.getIntent())` runs.
3. `render(interpolationAlpha)` draws the interpolated player and follow camera.
4. Pause skips simulation and keeps rendering.

There is no combat state machine yet.

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

| State                           | Owner           | Notes                                         |
| ------------------------------- | --------------- | --------------------------------------------- |
| Player position, facing, radius | `World`         | Source of truth; interpolated only for render |
| Input intent                    | `KeyboardInput` | Screen axes; cleared on focus loss            |
| Loop status                     | `GameLoop`      | `idle`, `running`, `paused`, `disposed`       |
| Meshes, materials, camera       | `GameRenderer`  | Views of simulation state                     |
| Movement / camera tunables      | `src/config/`   | Typed constants                               |
| Enemy / combat state            | —               | Not implemented                               |

Do not store authoritative gameplay state on `Object3D.userData`.

## 7. Entity Management

The player is a plain `PlayerState` (`x`, `y`, `z`, `facingYaw`, `radius`). Rendering copies that snapshot onto a placeholder group. Mesh internals are not gameplay.

Planned next: Skeleton Warrior and other combat entities.

## 8. Input Flow

Implemented:

```text
Keyboard (WASD / arrows)
        ↓
   KeyboardInput / keyboardState
        ↓
  InputIntent { axisX, axisY }   // screen space, normalized
        ↓
  screenIntentToWorld()          // isometric XZ basis
        ↓
   MovementSystem
```

W/Up moves toward world `(-X, -Z)` so “up” on screen matches the camera at `+X +Y +Z`. See `docs/decisions/0006-isometric-keyboard-mapping.md`.

Arrow keys call `preventDefault()` to avoid page scrolling. Blur, focus, and `visibilitychange` clear held keys so movement cannot stick after tabbing away.

Touch can emit the same `InputIntent` later.

## 9. Collision and Physics

Player motion is clamped to a square on the XZ plane: `|x|` and `|z|` cannot exceed `ARENA_HALF_EXTENT - radius`. There is no rigid-body physics.

See `docs/decisions/0005-simplified-collision-before-rapier.md`.

## 10. Rendering

Implemented renderer responsibilities:

- Own the `WebGLRenderer`, resize handling, and WebGL2 checks.
- Draw a procedural forest (shared/instanced trees, rocks, grass, boundary stones).
- Draw a stylized Bernardo placeholder whose transform is copied from simulation.
- Follow the interpolated player with a fixed isometric offset and exponential smoothing.
- Dispose geometries, materials, instanced meshes, listeners, and the renderer.

The camera does not orbit. Animation mixers and GLB loading are not implemented.

See `docs/decisions/0004-incremental-asset-integration.md`.

## 11. Asset Loading

No production asset pipeline exists yet. The forest and Bernardo are procedural placeholders.

## 12. Audio and UI

- Audio is not implemented.
- UI is a full-viewport canvas, a boot-error message, and a small “Move: WASD / Arrow Keys” hint.
- No event bus. Do not add one until combat, UI, and audio need decoupling.

## 13. Persistence

Not implemented. No server, no accounts.

## 14. Testing Strategy

| Layer       | Tool                    | What exists now                                                   |
| ----------- | ----------------------- | ----------------------------------------------------------------- |
| Unit        | Vitest                  | GameLoop, movement, bounds, intent, keyboard state, camera follow |
| Integration | Vitest                  | World interpolation snapshot                                      |
| E2E         | Playwright              | Not installed                                                     |
| Quality     | `tsc`, ESLint, Prettier | Configured                                                        |
| Build       | Vite                    | `npm run build`                                                   |

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

| Resource                           | Dispose when                    |
| ---------------------------------- | ------------------------------- |
| Animation frame handle             | `GameLoop.stop()` / `dispose()` |
| Window `resize` listener           | `GameRenderer.dispose()`        |
| Keyboard listeners                 | `KeyboardInput.dispose()`       |
| Forest and placeholder GPU objects | `GameRenderer.dispose()`        |
| `WebGLRenderer`                    | `GameRenderer.dispose()`        |
| Session on tab hide                | `pagehide` in `main.ts`         |

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

Phase 3 should add Skeleton Warriors, spawn, automatic attacks, health, death, and restart. Movement and camera stay as they are unless combat requires new collision queries.
