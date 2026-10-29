# ADR 0005: Simplified collision before Rapier

- Status: Accepted
- Date: 2026-10-29

## Context

The original stack table listed Rapier as a core dependency, while the performance target includes 200 or more active skeletons. Full rigid-body simulation per enemy is likely more expensive than the game needs. Early combat is top-down movement on a forest floor, not tumbling ragdolls.

The product requirement is "use Rapier where physics adds value," not "Rapier on day one."

## Decision

Implement gameplay collision as simplified XZ-plane shapes (circles or AABBs) owned by the simulation.

Do not add Rapier during Phase 1. Reconsider it when a feature needs 3D physics that this model cannot provide, such as a complex character controller or destructible 3D props.

The README may continue to list Rapier as an allowed library. It is not a foundation dependency.

## Alternatives considered

- **Rapier for every skeleton from Phase 1:** matches the original stack table, risks cost and WASM complexity before a player can move.
- **Three.js raycaster as gameplay collision:** coupled to rendering, poor fit for crowd simulation tests.
- **Grid occupancy only:** cheap, weaker for continuous movement and attack range.

## Consequences

- Phase 1 install size and CI stay smaller.
- Crowd queries can later use a spatial hash without a physics world.
- If Rapier is adopted, it should sit behind a physics adapter so systems do not scatter WASM calls.
- Some 3D interactions may feel less physical until a later milestone.
