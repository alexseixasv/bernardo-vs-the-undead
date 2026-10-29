# ADR 0007: Pause simulation for data-driven level-up choices

- Status: Accepted
- Date: 2026-10-29

## Context

Phase 4 needs a roguelite level-up: the run pauses, the player picks one upgrade, then combat resumes. A CSS overlay by itself would still let `World.step` move Bernardo, spawn skeletons, tick cooldowns, and apply contact damage. Catch-up after a long overlay would also dump several simulation frames at once.

Abilities must stay testable without WebGL and without a scripting engine.

## Decision

1. `World` gains a `levelUp` run status. While that status is set, `step()` is a no-op: time, movement, spawn, combat, and gem pickup do not advance.
2. `Game` pauses `GameLoop` when entering `levelUp` or `gameOver`. `GameLoop.resume()` already resets the clock, so leftover wall-clock time does not catch up.
3. Upgrade definitions live in `src/config/abilities.ts`. `AbilitySystem` generates eligible offers and applies one upgrade. Combat and movement derive effective stats from the loadout.

Rendering and the HTML overlay may keep animating. They do not author XP, ability levels, or pause rules.

## Alternatives considered

- **CSS overlay only:** simple, but simulation would continue behind the menu.
- **Variable-delta pause flag inside systems:** easy to miss a cooldown or spawn timer.
- **Ability scripting / inheritance tree:** too much machinery for five explicit upgrades.

## Consequences

- Tests can freeze a world in `levelUp` and assert that position and elapsed time stay still.
- Sequential pending level-ups each generate a fresh offer set.
- If the upgrade pool is empty, the world consumes pending levels and returns to `playing` so a run cannot soft-lock.
- Contributors must not tick gameplay timers from `requestAnimationFrame` while the overlay is visible.
