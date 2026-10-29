# AGENTS.md

Persistent engineering instructions for Bernardo vs. The Undead: Rise of the Siren King.

Read this file, `README.md`, `docs/GAME_DESIGN.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, and relevant ADRs in `docs/decisions/` before implementing a milestone.

## Project

Single-player 3D browser survival roguelite. The player controls Bernardo, survives skeleton hordes in an enchanted forest, collects experience, upgrades abilities, and eventually fights the Siren King.

The repository must remain both a playable game and a professional engineering portfolio project.

## Current Phase

Determine the active milestone from `docs/ROADMAP.md`.

- Implement one coherent milestone at a time.
- Do not skip phases.
- Do not start the next phase until the current one is complete and the user approves.
- Do not initialize tooling, install dependencies, or write gameplay code during documentation-only milestones.

## Technology Stack

Use these technologies unless an ADR records a change:

| Concern | Technology |
|---|---|
| Language | TypeScript, `strict` mode |
| Rendering | Three.js |
| Build | Vite |
| Package manager | npm |
| Unit tests | Vitest |
| E2E tests | Playwright, when browser workflows exist |
| Quality | ESLint, Prettier |
| CI | GitHub Actions |
| Deploy | Cloudflare Pages |

Adopt only when a milestone requires them:

- Rapier: 3D physics that simplified collision cannot cover. See `docs/decisions/0005-simplified-collision-before-rapier.md`.
- Howler.js: audio.
- IndexedDB: local persistence.

Do not introduce Next.js, NestJS, Express, a database server, authentication, multiplayer networking, a frontend UI framework, or a large state-management library.

Gameplay must run entirely in the browser.

## Architecture Constraints

- Separate gameplay simulation from rendering, input, audio, UI, configuration, and persistence.
- Gameplay calculations must be testable without WebGL.
- Prefer composition over inheritance. Do not introduce a full ECS unless measured complexity requires it.
- Keep combat, enemies, abilities, and progression data-driven in `src/config/`.
- Use a fixed-timestep simulation. Rendering must not own gameplay rules.
- Every system that allocates resources must dispose of them on scene changes and run restarts.
- Gameplay must not depend on specific GLB filenames or mesh hierarchies. Use asset configuration and adapters.
- Placeholder models must be replaceable with final GLB assets.
- Introduce directories and modules only when a milestone needs them. Do not scaffold empty trees.
- Do not create a backend.

## Gameplay Constraints

- Protagonist: Bernardo.
- Regular enemies: skeletons only. Do not add zombies.
- Combat is automatic. The player controls movement and positioning.
- Camera: isometric 3D, desktop keyboard first, touch later.
- Final boss: the Siren King, an original creature. Do not copy copyrighted monster designs.
- All characters, artwork, environments, and audio must be original or correctly licensed.

## Coding Conventions

- English for code, comments, documentation, commit messages, and review notes.
- Small modules, explicit interfaces, and predictable state transitions.
- Typed configuration instead of scattered balance constants.
- Clear names. Avoid god objects, circular dependencies, and speculative abstraction.
- No placeholder methods that silently do nothing.
- No hardcoded gameplay rules in rendering or input modules.
- Prefer native browser APIs and lightweight dependencies.

## Testing

- Unit-test deterministic gameplay: movement, damage, health, cooldowns, spawning, progression, boss phases.
- Integration-test system interactions.
- Use Playwright for critical browser workflows once a playable scene exists. Prefer observable game state over screenshot assertions.
- Do not expose sensitive debug hooks in production builds.
- Do not claim tests passed unless they were executed successfully in that session.

Required checks for implementation milestones:

1. TypeScript
2. Lint
3. Relevant unit/integration tests
4. Production build, when application code exists
5. Browser or E2E tests, when applicable

Documentation-only milestones are verified by consistency review, not by claiming missing application checks.

## Performance

Targets, not guarantees: 60 FPS on a documented desktop reference machine; 200 or more active skeletons where feasible; stable memory across restarts.

Prefer object pooling, instanced rendering, spatial partitioning, simple collision shapes, and cheap AI updates. Measure before claiming improvements. Record browser, hardware, enemy count, FPS, and frame-time notes in `docs/PERFORMANCE.md` when benchmarks exist.

Do not put a rigid-body simulation on every skeleton without justification.

## Assets and Licensing

- Source code: MIT (`LICENSE`).
- Original creative assets: all rights reserved unless stated otherwise (`ASSETS_LICENSE.md`).
- Third-party assets: document name, creator, source, license, and attribution in `public/assets/README.md` before committing.
- Do not modify license files without explicit approval.
- Do not commit personal photographs, private character references, secrets, credentials, `.env` files, unlicensed assets, or generated build output.
- Preferred 3D format: GLB/GLTF. Filenames: lowercase kebab-case.

## Git

- Conventional Commits, in English, focused on why.
- Do not commit, push, tag, or change remotes unless the user explicitly asks.
- After a completed milestone, suggest a commit summary and a short description. The user commits through GitHub Desktop.
- Do not use `--no-verify`, force push to `main`, or destructive git commands unless the user explicitly requests them.

## Documentation

- Keep docs aligned with the implementation. Never describe planned work as shipped.
- Update `docs/ARCHITECTURE.md` when runtime structure changes.
- Update `docs/GAME_DESIGN.md` when gameplay rules change.
- Add an ADR in `docs/decisions/` for consequential technical choices.
- Update `docs/ROADMAP.md` checkbox status when a milestone finishes.
- Create `docs/PERFORMANCE.md` when the first real measurements exist.

## Workflow

Research → Plan → Implement → Test → Review → Document → Learn.

Each non-trivial milestone plan must include objective, scope, files, dependencies, technical decisions, risks, acceptance criteria, and testing strategy.

After a meaningful milestone, record decisions, problems, solutions, and follow-ups in the relevant doc or ADR so later sessions do not repeat solved work.

## Definition of Done

A milestone is done only when:

- Acceptance criteria are met.
- Implementation works, or documentation-only work is internally consistent.
- Relevant tests, typecheck, lint, and production build pass when those tools exist.
- Documentation matches reality.
- No known critical regression remains.
- Resource lifecycle is handled for anything that allocates.
- Changes are ready for review.
- No commit or push was made without user approval.
