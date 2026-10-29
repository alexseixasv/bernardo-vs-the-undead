# Performance

First measured pass for Bernardo vs. The Undead. Targets from the product docs are **not** guarantees. Production still caps at `MAX_ACTIVE_SKELETONS` (14). Counts of 30 and 50 used the development-only `?stress=` flag. This document does **not** claim a 200-enemy budget.

## Machine and host

| Item | Value |
| --- | --- |
| Date | 2026-10-29 |
| OS | Windows 10.0.26200 |
| Host | Cursor 3.17.8 embedded browser (Electron 40.10.3, Chromium 144) |
| User agent | `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Cursor/3.17.8 Chrome/144.0.7559.236 Electron/40.10.3 Safari/537.36` |
| Viewport | 1102 × 582, devicePixelRatio 1 |
| `navigator.hardwareConcurrency` | 16 |
| `navigator.deviceMemory` | 8 |
| Build | Vite 8.3.5 development server (`npm run dev`) |
| Overlay | `?perf` (`renderer.info.render.calls` / `triangles` after each frame) |

These numbers describe the Cursor embedded tab used for verification, not a standalone Chrome window on a documented gaming desktop. FPS in this host oscillated between ~30 and ~60 even with one skeleton, so treat 60 FPS samples during a paused level-up as best-case, not combat load.

## Overlay method

`PerformanceOverlay` averages FPS over 0.5 s and shows the latest frame time. Enemy and gem counts are live view counts, including lingering death meshes. Draw-call and triangle counts come from Three.js after `WebGLRenderer.render`.

Enable locally:

- `http://localhost:5173/?perf`
- `http://localhost:5173/?perf&stress=30`
- `http://localhost:5173/?perf&stress=50`

Production builds ignore both flags.

## Measured scenarios

| Scenario | Active skeletons | Overlay FPS | Frame time | Draw calls | Triangles | Gems | Simulation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Default spawn | 1 | 30 | 32.7 ms | 49 | 8844 | 0 | Playing |
| Default spawn, two warriors | 2 | 60 | 16.7–17.0 ms | 68 | 9540 | 0 | Playing |
| `?stress=14` | 14 | 60 | 15.7–16.1 ms | 299 | 18084 | 0 | Level-up pause |
| `?stress=30` | 30 | 28 | 33.4 ms | 603 | 29220 | 0 | Playing (paused immediately after) |
| `?stress=50` | 50 | 60 | 16.1–16.5 ms | 983 | 43140 | 0 | Level-up pause |
| `?stress=50` combat | 50 | 30 | 32.6–33.3 ms | 982–983 | ~42972–43140 | 0 | Playing |

Restart with `?stress=50` returned to ~983 draws / 50 skeleton views. No unbounded overlay growth was observed across two restarts.

## Reading the numbers

- **Draw calls scale with skeleton meshes.** About 19–20 extra calls per warrior (multi-mesh procedural body, not instanced). Forest trees, bushes, and mushrooms are instanced and stay cheap.
- **Triangle count is modest.** ~9k for the arena plus Bernardo, plus roughly 700 triangles per skeleton. This is not the current limiter.
- **Level-up pause inflates FPS.** Simulation stops; the overlay can report 60 FPS at 50 enemies while combat at the same count reported ~30 FPS in this host.
- **200 enemies were not measured.** Linear draw-call growth suggests ~4k calls at 200 uninstanced warriors, which this pass does not validate.

## Memory and cleanup

Verified in code and in-browser restarts:

- Skeleton views are pooled by id and removed on death after `VISUAL_DEATH_LINGER` (0.35 s).
- Gem views are removed when the simulation gem disappears.
- Pulse, slash, and impact meshes are reused, not spawned per hit.
- Skeleton bone geometries and materials are shared.
- `Game.restart()` clears lingering death views. Two consecutive restarts did not grow draw calls.
- Audio context closes on `Game.dispose()`. HUD mute and upgrade listeners are removed on dispose.

`renderer.info.memory` was not exported by the overlay in this pass.

## Visible bottlenecks

1. Per-skeleton draw calls from uninstanced multi-mesh placeholders.
2. Host frame pacing in the Cursor embedded browser (30 vs 60 Hz).
3. Frequent level-up pauses during stress fills, which hide combat cost if sampled only from the overlay.

Not yet a bottleneck at 14 production enemies: triangle count, fog, instanced forest, synthesized SFX.

## Follow-ups (not this phase)

- Instanced or batched skeleton rendering before raising the production cap.
- Repeat this table in standalone Chrome on the reference desktop.
- Sample while a run is playing, not only during level-up.
- Record GPU memory if a later overlay exposes `renderer.info.memory`.
