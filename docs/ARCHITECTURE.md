# Architecture

Technical architecture for Bernardo vs. The Undead: Rise of the Siren King.

This document describes the architecture **as implemented**, and marks remaining systems as planned.

Related decisions: `docs/decisions/`.

## 1. Current Runtime Reality

Phase 3 is implemented: a playable combat prototype with Skeleton Warriors, automatic attacks, health, HUD, and restart.

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
| Combat, spawn, HUD, restart              | Implemented     |
| Abilities, XP, audio, boss               | Not implemented |

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
  config/combat.ts                     Health, attack, spawn, and cooldown values
  entities/player.ts                   Player simulation state
  entities/enemy.ts                    Skeleton Warrior simulation state
  input/
    InputIntent.ts                     Screen-space movement axes
    isometric.ts                       Screen → XZ mapping
    keyboardState.ts                   Pure keyboard reducer
    KeyboardInput.ts                   DOM listeners
  systems/MovementSystem.ts            Speed, facing, arena clamp
  systems/SpawnSystem.ts               Seedable warrior spawning
  systems/PursuitSystem.ts             Direct XZ chase
  systems/CombatSystem.ts              Targeting, damage, contact hits
  world/World.ts                       Run simulation and interpolated snapshots
  rendering/
    GameRenderer.ts                    WebGLRenderer, views, VFX, dispose
    createForestArena.ts               Procedural forest
    createBernardoPlaceholder.ts       Stylized placeholder mesh
    createSkeletonPlaceholder.ts       Shared-geometry warrior views
    cameraFollow.ts                    Smooth isometric follow
    webgl.ts                           WebGL2 detection
  ui/Hud.ts                            Health, kills, timer, game over
  style.css
```

Intended later, still absent:

```text
src/
  types/
  systems/                             Progression
  entities/                            Bosses, projectiles
  abilities/
  audio/
```

| Area           | Responsibility                                         | Status                 |
| -------------- | ------------------------------------------------------ | ---------------------- |
| `core`         | Session lifecycle, fixed-timestep loop, pause, dispose | Implemented            |
| `rendering`    | Forest, placeholder Bernardo, follow camera, dispose   | Implemented            |
| `systems`      | Movement, spawn, pursuit, combat                       | Implemented            |
| `entities`     | Player and Skeleton Warrior data                       | Implemented            |
| `input`        | Keyboard → `InputIntent`                               | Implemented            |
| `config`       | Movement, camera, and arena values                     | Implemented            |
| `audio`        | Howler adapter                                         | Planned, Phase 5       |
| `ui`           | Health, kills, timer, game-over overlay                | Implemented            |
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
2. While enough time remains, `World.step(1 / 60, input.getIntent())` runs spawn, movement, pursuit, attacks, and contact damage.
3. `render(interpolationAlpha)` draws interpolated actors, attack pulse, and HUD.
4. On game over the loop pauses simulation, keeps rendering, and shows the overlay.
5. Restart resets simulation and enemy views without creating a second animation loop.

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

| State                              | Owner           | Notes                                         |
| ---------------------------------- | --------------- | --------------------------------------------- |
| Player position, health, cooldowns | `World`         | Source of truth; interpolated only for render |
| Enemy warriors                     | `World`         | Plain data with numeric ids                   |
| Input intent                       | `KeyboardInput` | Screen axes; cleared on focus loss            |
| Loop status                        | `GameLoop`      | `idle`, `running`, `paused`, `disposed`       |
| Meshes, materials, camera          | `GameRenderer`  | Views keyed by enemy id                       |
| Combat tunables                    | `src/config/`   | Typed constants                               |

Do not store authoritative gameplay state on `Object3D.userData`.

## 7. Entity Management

The player is a plain `PlayerState`. Skeleton Warriors are plain `EnemyState` records. The renderer keeps a map of visual groups keyed by enemy id, using shared geometries and materials.

Planned next: experience pickups and ability choices. Extra skeleton types wait until this warrior loop is fun.

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
- Pool Skeleton Warrior views by id with shared bone geometries and materials.
- Show a short attack ring and scale/flash hit and death reactions.
- Follow the interpolated player with a fixed isometric offset and exponential smoothing.
- Dispose geometries, materials, instanced meshes, listeners, and the renderer.

The camera does not orbit. Animation mixers and GLB loading are not implemented.

See `docs/decisions/0004-incremental-asset-integration.md`.

## 11. Asset Loading

No production asset pipeline exists yet. The forest, Bernardo, and Skeleton Warriors are procedural placeholders.

## 12. Audio and UI

- Audio is not implemented.
- UI is HTML/CSS: health bar, kill count, run timer, movement hint, and a Game Over overlay with Restart.
- HUD values update only when they change.
- No event bus.

## 13. Persistence

Not implemented. No server, no accounts.

## 14. Testing Strategy

| Layer       | Tool                    | What exists now                                                 |
| ----------- | ----------------------- | --------------------------------------------------------------- |
| Unit        | Vitest                  | GameLoop, movement, spawn, pursuit, targeting, damage, HUD time |
| Integration | Vitest                  | World interpolation, game-over, restart                         |
| E2E         | Playwright              | Not installed                                                   |
| Quality     | `tsc`, ESLint, Prettier | Configured                                                      |
| Build       | Vite                    | `npm run build`                                                 |

`GameLoop` tests inject a manual clock and frame scheduler. They must not wait on real wall-clock time.

## 15. Performance Envelope

Targets from the product docs, not measured results:

- 60 FPS on a documented desktop reference machine.
- 200 or more active skeletons where feasible.
- Stable memory across repeated restarts.

The production bundle is dominated by Three.js (currently above Vite's 500 kB chunk warning). That is expected for an unsplit first scene and is not an optimization pass.

`docs/PERFORMANCE.md` remains absent until a measured pass with a documented machine, browser, and enemy count. The current cap is `MAX_ACTIVE_SKELETONS` (14). That is a gameplay limit, not a proven 200-enemy budget.

## 16. Resource Lifecycle

Implemented dispose paths:

| Resource                                      | Dispose when                                  |
| --------------------------------------------- | --------------------------------------------- |
| Animation frame handle                        | `GameLoop.stop()` / `dispose()`               |
| Window `resize` listener                      | `GameRenderer.dispose()`                      |
| Keyboard listeners                            | `KeyboardInput.dispose()`                     |
| Forest, Bernardo, skeleton, pulse GPU objects | `GameRenderer.dispose()` / `resetForNewRun()` |
| HUD restart listener                          | `Hud.dispose()`                               |
| `WebGLRenderer`                               | `GameRenderer.dispose()`                      |
| Session on tab hide                           | `pagehide` in `main.ts`                       |

`Game.restart()` resets simulation and enemy views without stacking listeners or animation frames. `Game.dispose()` is idempotent.

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

Phase 4 should add experience pickups, a paused upgrade choice, and one upgradeable ability. Keep targeting and spawn data-driven so new abilities do not rewrite combat.
