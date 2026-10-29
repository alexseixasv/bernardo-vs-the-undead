# Game Assets

This directory contains the visual and audio assets used by **Bernardo vs. The Undead: Rise of the Siren King**.

All assets must be properly documented, optimized, and licensed before being included in the project.

## Directory Structure

The following structure is planned and will be created incrementally:

```text
assets/
├── characters/
│   └── bernardo/
├── enemies/
│   └── skeletons/
├── bosses/
│   └── siren-king/
├── environments/
│   └── forest/
├── animations/
├── textures/
├── audio/
│   ├── music/
│   └── sfx/
└── ui/
```

## Asset Formats

Preferred formats:

| Asset Type | Preferred Format |
|---|---|
| 3D Models | GLB / GLTF |
| Textures | WebP / PNG / KTX2 |
| Animations | GLB / GLTF |
| Sound Effects | OGG / MP3 |
| Music | OGG / MP3 |
| UI Icons | SVG / PNG |

Formats may change according to browser compatibility and performance requirements.

## Naming Conventions

Use lowercase kebab-case filenames.

Examples:

- `bernardo.glb`
- `bernardo-idle.glb`
- `skeleton-warrior.glb`
- `skeleton-archer.glb`
- `siren-king.glb`
- `forest-ground.webp`
- `skeleton-death.ogg`

Avoid spaces, uppercase filenames, and ambiguous names.

## Asset Attribution

Every third-party asset must be documented before being committed.

| Asset | Creator | Source | License | Status |
|---|---|---|---|---|
| No third-party assets added yet | — | — | — | Pending |

Update this table whenever a third-party asset is introduced.

## Original Assets

Original creative assets are subject to the terms described in the repository's [`ASSETS_LICENSE.md`](../../ASSETS_LICENSE.md).

The source code's MIT License does not automatically apply to original game artwork, models, animations, or audio.

## Personal Reference Materials

Do not commit:

- Personal photographs.
- Private character reference images.
- Sensitive personal information.
- Unlicensed reference materials.
- Temporary files containing personal data.

Private reference materials must remain outside the public repository.

## Optimization Guidelines

Before adding assets:

1. Remove unnecessary geometry.
2. Reduce texture sizes when possible.
3. Use compressed formats where appropriate.
4. Avoid unnecessarily large animation files.
5. Validate models in the browser.
6. Verify licensing and attribution.
7. Measure the impact on loading time and rendering performance.

## Asset Pipeline

The intended workflow is:

**Concept Art → 3D Modeling → Rigging → Animation → Optimization → Export → Integration → Validation**

Assets should remain independent of gameplay logic whenever possible.

---

**All original game assets are reserved unless explicitly licensed otherwise.**