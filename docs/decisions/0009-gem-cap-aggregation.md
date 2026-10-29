# ADR 0009: Aggregate XP gems at the cap instead of granting overflow XP

- Status: Accepted
- Date: 2026-10-29

## Context

Phase 4 capped live gems at 40 and converted the oldest overflow into player XP immediately. That awards experience without a collection action and can feel like the world is collecting for the player.

Phase 5 still needs a bounded gem list for pooling and draw cost.

## Decision

When a drop would exceed `MAX_ACTIVE_GEMS`, merge the closest pair into one gem whose XP is the sum of both. Repeat until the list fits. Total uncollected XP stays in the world. Pickup and attract remain simulation-owned.

## Alternatives considered

- **Silent overflow XP:** simple, but removes player agency.
- **Delete oldest gems:** loses XP.
- **Raise or remove the cap:** unbounded pooling and draw cost.

## Consequences

- Tests must prove total gem XP is conserved and collection still happens once.
- Merged gems can be worth more than `XP_PER_GEM`; the renderer scales them.
- Attract and pickup stay deterministic and independent of visual bobbing.
