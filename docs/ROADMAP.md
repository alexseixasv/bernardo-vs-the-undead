# Roadmap

Development is sequenced so each milestone is independently verifiable. A playable vertical slice is more important than broad infrastructure.

**Current milestone:** Phase 6 complete. Phase 7 is next and must not start without explicit approval.

Status values: `done`, `next`, `planned`.

## Summary

| ID  | Milestone                 | Goal                                           | Status  |
| --- | ------------------------- | ---------------------------------------------- | ------- |
| M0  | Engineering documentation | Shared product and architecture baseline       | done    |
| M1  | Technical foundation      | Tooling, loop, empty 3D scene, CI              | done    |
| M2  | First playable scene      | Move a placeholder Bernardo in a forest arena  | done    |
| M3  | Combat prototype          | Skeleton warriors, auto-attack, death, restart | done    |
| M4  | Progression               | XP, level-up, one upgradeable ability          | done    |
| M5  | Visual identity           | Final-style models, animation, audio           | done    |
| M6  | Horde rendering           | Instanced skeletons, measured draw-call cut    | done    |
| M7  | Siren King                | Boss phases and victory                        | next    |
| M8  | Polish                    | Settings, accessibility, remaining perf        | planned |
| M9  | Public release            | Deployment and portfolio presentation          | planned |

## M0 — Engineering documentation

**Goal:** Make later implementation reviewable and consistent.

**Scope:** Documentation and planning only. No application scaffold, dependency install, or gameplay code.

**Deliverables:**

- `AGENTS.md`
- `docs/GAME_DESIGN.md`
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- Initial ADRs in `docs/decisions/`
- README status aligned with these documents

**Acceptance criteria:**

- Documents agree with `README.md`, `LICENSE`, `ASSETS_LICENSE.md`, and `public/assets/README.md`.
- Confirmed gameplay is separated from planned ideas.
- Unimplemented architecture is marked planned.
- License files are unchanged.

**Testing requirements:** Consistency review of documentation. No application checks exist.

**Dependencies:** Existing repository documentation.

## M1 — Technical foundation

**Goal:** Create a maintainable TypeScript + Vite + Three.js bootstrap with a testable game loop and CI.

**Scope:**

- npm project with TypeScript `strict`, Vite, Three.js, ESLint, Prettier, Vitest
- Minimal WebGL2 scene that clears, renders, and resizes
- Fixed-timestep loop with start, pause, stop, and dispose
- GitHub Actions for typecheck, lint, unit tests, and production build

**Out of scope:** Rapier, Howler, Playwright, player movement, assets, UI gameplay HUD.

**Deliverables:**

- `package.json`, `tsconfig.json`, `vite.config.ts`, lint/format config
- `src/main.ts` and core loop/session modules
- At least one unit test for timestep accumulation
- `.github/workflows/` CI
- Architecture doc updated to mark the loop implemented

**Acceptance criteria:**

- `npm run dev`, `npm run build`, `npm run test`, `npm run lint`, and `npm run typecheck` exist and pass.
- A browser tab shows a stable Three.js scene (clear color or simple ground is enough).
- Loop dispose stops the animation frame and can be restarted without stacking loops.
- CI runs on pull requests.

**Testing requirements:** Typecheck, lint, unit tests, production build.

**Dependencies:** M0. Node.js LTS.

## M2 — First playable scene

**Goal:** The player can move a placeholder Bernardo around a bounded forest arena from an isometric camera.

**Scope:**

- Placeholder arena (ground + simple forest cues)
- Isometric follow camera
- Player placeholder mesh driven by simulation movement
- Keyboard movement intent
- Arena bounds
- Minimal on-screen proof of movement (position or a tiny debug HUD allowed in development only)

**Out of scope:** Enemies, combat, XP, final Bernardo model, audio.

**Deliverables:**

- Movement system with typed speed configuration
- Input adapter
- Player view adapter
- Unit tests for movement and bounds clamping
- Playwright smoke test that the app boots (optional if CI time is a concern; required no later than M3)

**Acceptance criteria:**

- WASD/arrows move the player on the XZ plane.
- Camera remains isometric and follows the player.
- The player cannot leave the arena.
- Restarting the session does not leak listeners.
- Gameplay movement tests pass without WebGL.

**Testing requirements:** Unit tests for movement/bounds; typecheck; lint; build; browser verification of the movement path.

**Dependencies:** M1.

## M3 — Combat prototype (first vertical slice)

**Goal:** A short survival loop: skeletons spawn, chase, deal damage, die to automatic attacks, and the run can end and restart.

**Scope:**

- Skeleton Warrior only
- Spawn + pursue + contact/melee damage
- One automatic nearby attack
- Health for player and enemies
- Death, game-over, restart
- Lightweight visual feedback (color flash or equivalent)

**Out of scope:** Other skeleton types, XP, abilities menu, boss, audio, instanced rendering unless already trivial.

**Deliverables:**

- Enemy, combat, spawn, and health systems
- Typed warrior config
- Unit tests for damage, death, cooldown, and spawn rules
- Restart path that disposes enemies and views

**Acceptance criteria:**

- Warriors spawn and pursue Bernardo.
- Automatic attacks reduce enemy health and remove dead enemies.
- Player death shows a game-over state and allows restart.
- Simulation tests cover damage and death without WebGL.

**Testing requirements:** Unit/integration tests; typecheck; lint; build; browser playthrough of spawn → kill → die → restart.

**Dependencies:** M2.

## M4 — Progression

**Goal:** Defeating enemies grows Bernardo through experience and a paused upgrade choice.

**Scope:**

- Experience crystals or equivalent pickup
- Level-up pause
- At least one ability with at least one upgrade path
- Data-driven ability configuration
- Basic difficulty scaling over time

**Out of scope:** Full ability roster, meta-unlocks between runs, boss.

**Deliverables:**

- Progression system and ability selection UI
- Tests for XP thresholds, pause gating, and upgrade application

**Acceptance criteria:**

- Killing enemies yields collectable experience.
- Level-up pauses simulation and presents choices.
- Choosing an upgrade changes subsequent combat behavior.
- A longer run is noticeably harder than the opening seconds.

**Testing requirements:** Unit tests for progression math; integration tests for level-up applying an upgrade; browser verification of the pause overlay.

**Dependencies:** M3.

## M5 — Visual identity

**Goal:** Polish the playable prototype with readable characters, procedural animation, combat/XP feedback, forest atmosphere, and synthesized SFX — without coupling gameplay to mesh internals.

**Status:** Complete (procedural polish). Final GLB models and sampled music remain deferred.

**Scope:**

- Improved procedural Bernardo and Skeleton Warrior meshes
- Lightweight pose selection (`idle`, `walk`, `hurt`, `defeat` / `contact`, `hit`, `death`)
- Combat VFX for Magic Pulse and Lightning Sword
- Magnetized XP gems and cap aggregation (no silent XP)
- Forest atmosphere (fog, bushes, mushrooms, lighting)
- Web Audio synthesized SFX, mute, gesture unlock
- HUD polish and a development-only performance overlay

**Out of scope:** Siren King, extra enemy types, extra weapons, Howler.js, third-party character downloads, Rapier, React.

**Deliverables:**

- Character pose adapter boundary for a later GLB + `AnimationMixer`
- Synthesized `AudioSystem` (ADR 0008)
- `docs/PERFORMANCE.md` with measured FPS at 14 / 30 / 50 enemies (dev stress)

**Acceptance criteria:**

- Bernardo and skeletons read at gameplay camera distance and animate without moving simulation bodies.
- Combat and XP feedback are visually distinct; XP is neither lost nor duplicated.
- Audio is silent until a user gesture and can be muted.
- Production enemy cap stays at 14; stress counts are development-only.
- No private photographs or unlicensed files are added.

**Testing requirements:** Pose selection, gem aggregation/conservation, audio mute/unlock, restart cleanup; browser verification; production build.

**Dependencies:** M4. Original or licensed assets.

## M6 — Horde rendering

**Goal:** Cut skeleton draw calls without dropping walk/hit/death poses, and measure the result without paused level-up screens.

**Status:** Complete. Production enemy cap remains 14.

**Scope:**

- Repeatable `?perf` / `?stress` / `?bench` overlay (median, p95, sim vs render)
- Instanced body-part rendering with per-enemy procedural animation
- Instance slot reuse, death linger, restart cleanup
- Compact previous-pose maps for interpolation
- Stress presets 14 / 30 / 50 / 100 / 200 in development only

**Out of scope:** Siren King, extra enemy types, custom bone shaders, spatial hashing, raising the production cap.

**Deliverables:**

- Instanced skeleton horde (ADR 0010)
- Slot-pool and pose unit tests
- `docs/PERFORMANCE.md` before/after table

**Acceptance criteria:**

- Draw calls at 50 living warriors drop by at least 50% versus the Phase 5 baseline.
- Walking, hit, and death remain readable.
- Restart does not leave ghost instances.
- Production still caps at 14 living warriors.

**Testing requirements:** Slot allocation/reuse tests; gameplay tests unchanged; browser bench samples at 14–200.

**Dependencies:** M5.

## M7 — Siren King

**Goal:** A readable three-phase boss encounter with a victory sequence.

**Scope:**

- Original Siren King presentation
- Phase transitions at documented health windows (tunable)
- Sonic attacks with telegraphs
- Skeleton summoning during the middle phase
- Victory state

**Deliverables:**

- Boss configuration, phase state machine, attack telegraphs
- Tests for phase transitions and summon rules

**Acceptance criteria:**

- The boss appears after the run’s survival condition is met.
- Phases change at health thresholds.
- Attacks are telegraphed enough to dodge by movement.
- Defeating the boss enters a victory state.

**Testing requirements:** Unit tests for phases and summons; browser playtest of the encounter.

**Dependencies:** M3 at minimum; M4–M6 preferred so the fight is not against placeholders only.

## M8 — Polish

**Goal:** Measure, then optimize, and add production-quality extras.

**Scope:**

- Further instancing (gems, Bernardo) and spatial queries only as new measurements justify
- Graphics settings
- Local persistence if still desired
- Accessibility (contrast, reduced motion where practical, remappable keys if practical)
- Loading improvements

**Deliverables:**

- `docs/PERFORMANCE.md` with real hardware/browser numbers
- Settings UI
- Optional IndexedDB adapter

**Acceptance criteria:**

- Performance claims cite measurements.
- Repeated restart does not grow memory without bound in a short profiling session.
- Quality settings change something observable.

**Testing requirements:** Existing automated suite still green; documented manual perf pass.

**Dependencies:** A crowd large enough to measure, typically M3+.

## M9 — Public release

**Goal:** Ship a playable browser build with portfolio-grade documentation.

**Scope:**

- Cloudflare Pages (or equivalent static hosting)
- README screenshots/video
- Contribution scaffolding if the project should accept PRs
- Final pass on architecture and ADRs

**Acceptance criteria:**

- A public URL runs the game on a WebGL2 desktop browser.
- README setup commands match the repo.
- License and asset attribution remain accurate.

**Testing requirements:** CI green including E2E smoke tests.

**Dependencies:** A fun vertical slice at least through M3; intended public version includes M4–M8 as available.

## Explicit non-goals until reconsidered

- Zombie enemies
- Multiplayer or networking
- User accounts and a game server
- Next.js or other full-stack frameworks
- Building the entire ability roster before the first slice is fun
- Committing private family reference photographs
