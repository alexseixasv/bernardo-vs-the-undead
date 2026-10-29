# ADR 0004: Incremental asset integration

- Status: Accepted
- Date: 2026-10-29

## Context

Final stylized GLB characters, skeletons, forest pieces, and the Siren King do not exist in the repository yet. Waiting for finished art would block movement and combat. Baking Blender node names into gameplay would make those assets expensive to replace.

Original creative assets are also licensed separately from the MIT source code, and personal reference photographs must never enter the public tree.

## Decision

Develop against procedural or clearly temporary placeholders. Load real assets through a catalog/adapter using stable asset ids, not raw filenames scattered in systems.

Replace placeholders incrementally. Gameplay continues to see radii, speeds, health, and animation state names.

Keep private reference material outside the repository, as already encoded in `.gitignore` and `ASSETS_LICENSE.md`.

## Alternatives considered

- **Art-first production:** higher visual quality earlier, no playable slice until models exist.
- **Hardcoded mesh paths in systems:** fastest load, brittle swaps and licensing mistakes.
- **Committing private photos as modeling reference:** violates the project's privacy rules.

## Consequences

- Early builds will look like prototypes.
- Asset swaps should not require combat rewrites.
- Loaders need fallbacks and dispose paths.
- Third-party files need attribution in `public/assets/README.md` before they are committed.
