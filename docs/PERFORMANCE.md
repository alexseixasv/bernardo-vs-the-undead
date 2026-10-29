# Performance

Measured passes for Bernardo vs. The Undead. Targets from the product docs are **not** guarantees.

Production still caps at `MAX_ACTIVE_SKELETONS` (14). Larger counts use development-only `?stress=` and must be sampled with `?bench` so level-up pauses do not inflate FPS.

## Machine and host

| Item | Value |
| --- | --- |
| Date | 2026-10-29 |
| OS | Windows 10.0.26200 |
| Host | Cursor 3.17.8 embedded browser (Electron 40.10.3, Chromium 144) |
| Viewport | 1102 × 582, devicePixelRatio 1 |
| `navigator.hardwareConcurrency` | 16 |
| `navigator.deviceMemory` | 8 |
| Build | Vite 8.3.5 development server (`npm run dev`) |

This host’s compositor often vsyncs at **30 Hz**. Overlay FPS of 30 with ~1 ms of sim+render is **frame pacing**, not GPU saturation. Do not read those 30 FPS rows as a 60 FPS failure, and do not claim 60 FPS on a standalone desktop Chrome window from this host.

## How to measure

Development-only (ignored in production):

- `?perf` — rolling 180-frame overlay: FPS, median / p95 frame time, sim ms, render ms, draws, triangles, skeletons, gems, JS heap
- `?stress=N` — raise the living skeleton cap (`N` clamped to 200)
- `?bench` — skip contact damage and level-up pauses so the sample stays in `playing`

Presets used below: 14, 30, 50, 100, 200. Camera starts at the origin follow pose. `stressFill` burst-spawns until the cap. Samples are several overlay windows (~3–8 s), not a single second and not a paused level-up.

## Phase 5 baseline (before instancing)

Per-enemy `Mesh` groups, ~19–20 draws each. Several rows were taken during level-up pause (called out).

| Scenario | Skeletons | Overlay FPS | Frame | Draw calls | Triangles | Simulation |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Default spawn | 1 | 30 | 32.7 ms | 49 | 8844 | Playing |
| Default spawn | 2 | 60 | ~17 ms | 68 | 9540 | Playing |
| `?stress=14` | 14 | 60 | ~16 ms | **299** | 18084 | Level-up pause |
| `?stress=30` | 30 | 28 | 33.4 ms | **603** | 29220 | Playing, then pause |
| `?stress=50` combat | 50 | 30 | ~33 ms | **982–983** | ~43k | Playing |

## Phase 6 after instanced body parts

Eight `InstancedMesh` parts for the whole horde (torso, head, four limbs, two sockets). Pose math is unchanged. `?perf&stress=N&bench`.

| Skeletons | Overlay FPS | Median | p95 | Sim | Render | Draws | Triangles | Heap |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 3 (default spawn) | 30 | 33.3 ms | 34.0 ms | 0.08 ms | 0.74 ms | 38 | 10236 | 33 MB |
| 14–15 | 30 | 33.3 ms | 34.1 ms | 0.12 ms | 1.03 ms | 38 | 18588 | 33 MB |
| 30–31 | 30 | 33.3 ms | 34.2 ms | 0.18 ms | 1.51 ms | 38 | 29724 | 35 MB |
| 50–51 | 30 | 33.3 ms | 34.2 ms | 0.20 ms | 0.97 ms | 38 | ~43k | 43–47 MB |
| 100–101 | 30 | 33.3 ms | 34.3 ms | 0.25 ms | 1.21 ms | 38–41 | 78636 | 36 MB |
| 200–201 | 30 | 33.3 ms | 34.5 ms | 0.40 ms | 1.48 ms | 38–41 | ~148k | 37 MB |

Draw count is **38** with VFX off and **41** when pulse/slash/impact are visible. It no longer scales with horde size.

### Before / after at 50 skeletons

| Metric | Phase 5 | Phase 6 | Change |
| --- | ---: | ---: | --- |
| Draw calls | ~983 | 38 | **−96%** |
| Triangle count | ~43k | ~43k | similar |
| Sim time | not split | 0.20 ms | cheap |
| Render time | not split | ~1 ms | cheap vs 33 ms frames |
| Overlay FPS on this host | ~30 playing | ~30 | host pacing |

The 50% draw-call reduction goal is met with margin. Sim+render stays under 2 ms through 200 enemies on this machine, so **60 FPS is plausible** on a 60 Hz desktop browser. That was **not** measured here.

## Diagnosis

1. **Draw calls were the horde limiter.** Linear ~20 draws per uninstanced warrior.
2. **This embedded browser is often 30 Hz.** Median 33.3 ms even at 3 skeletons with 0.8 ms of work.
3. **Simulation is not the limiter.** Linear nearest-target and contact scans are 0.40 ms at 200 enemies. No spatial hash.
4. **Snapshot cloning is not the limiter.** Previous poses are now compact `{x,y,z}` maps. `getSnapshot` still allocates per-entity snapshot objects so callers can hold multiple samples. That cost is small next to the old draw path.
5. **Triangle count is modest** until 200 (~148k). Instanced forest stays cheap.

## Optimization

See ADR 0010. Rigid sub-meshes are merged; each animated node is one instanced part; a slot pool maps enemy ids onto dense instance indices and swap-removes on death. Hit tint is per-instance color. Death linger reuses the slot for `VISUAL_DEATH_LINGER`, then releases it.

Alternatives rejected: one rigid instanced character (no walk cycle); custom bone shaders; spatial partitioning without a sim-time problem.

## Visual tradeoffs

- Cheeks and skull no longer exist as independent meshes; they never animated separately.
- Hit feedback is an instance color flash plus the existing shake/scale pose.
- Walk, contact, hit, and death poses use the same numbers as Phase 5.

## Cleanup

Restart with `?stress=50` returned to 38 draws / 50 instance slots. Heap stayed ~33–47 MB across 14→200. No ghost warriors after restart. Overlay `skels` includes lingering death slots.

## Recommended production cap

Keep **14** living Skeleton Warriors for gameplay density and first-slice balance. Rendering is no longer the reason to stay at 14. Raising the cap is a design choice, not an engine emergency. 50 is a reasonable stress preset; 100 and 200 ran in this host without errors but pack tightly around Bernardo and are not a shipping encounter.

## Remaining bottlenecks

- Host / vsync pacing in the Cursor embedded tab.
- Per-frame instance matrix uploads (still cheap at 200).
- Gem views are still one mesh per gem (cap 40).
- Bernardo is still a multi-mesh placeholder (one character).
- No standalone Chrome 60 Hz desktop log yet.

## Follow-ups

- Repeat the Phase 6 table in a standalone desktop Chrome window before claiming 60 FPS.
- Consider instanced XP gems if the gem cap rises.
- Revisit the production enemy cap only with a gameplay pass, not a draw-call panic.
