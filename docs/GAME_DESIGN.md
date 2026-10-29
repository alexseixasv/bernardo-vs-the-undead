# Game Design Document

Bernardo vs. The Undead: Rise of the Siren King

This document is the gameplay source of truth. It distinguishes **confirmed** requirements from **planned** ideas. Numeric combat values are not finalized; they will live in typed configuration once combat exists.

**Status:** Confirmed design. Phase 5 is a polished combat-and-progression prototype: procedural character animation, synthesized SFX, and magnetized XP gems. The Siren King and final GLB models are not implemented yet.

## 1. Premise

Bernardo, a young cartoon adventurer, is trapped in a mysterious enchanted forest overrun by a skeleton army. He survives waves of enemies, grows stronger through experience and abilities, and must defeat the Siren King, a colossal original creature that commands the undead through supernatural sonic powers.

Inspiration for **gameplay patterns only**: Vampire Survivors, Hades, Brotato. Do not reproduce those games' assets, characters, or copyrighted creatures.

## 2. Confirmed Pillars

| Pillar      | Requirement                                                   |
| ----------- | ------------------------------------------------------------- |
| Protagonist | Bernardo                                                      |
| Perspective | Isometric 3D                                                  |
| Combat      | Automatic attacks; the player steers and positions            |
| Enemies     | Skeleton hordes only                                          |
| Setting     | Enchanted forest arena                                        |
| Progression | Experience collection, level-ups, upgradeable abilities       |
| Boss        | Siren King                                                    |
| Platform    | Desktop browsers first, WebGL2                                |
| Session     | Single-player, fully client-side                              |
| Tone        | Stylized cartoon characters in a slightly dark fantasy forest |

**Out of scope:** zombies, multiplayer, accounts, a backend, a downloadable client.

## 3. Player Fantasy

The player should feel like a small hero who stays mobile, reads the horde, and becomes dramatically more capable during a short run. Movement skill matters. Manual aiming of every attack does not.

## 4. Core Game Loop

Confirmed loop:

1. Start a run in the enchanted forest.
2. Move through the arena while attacks fire automatically.
3. Defeat skeletons and collect experience crystals.
4. Level up, pause, and choose an ability or upgrade.
5. Survive harder waves.
6. Face the Siren King after surviving long enough.
7. Win by defeating the boss, or lose when health reaches zero.

A complete run is an **initial target of 10–15 minutes**, subject to playtesting. The first playable slice must be much shorter.

## 5. Initial Playable Scope

The first enjoyable vertical slice (Phase 3) is implemented and Phase 4 extends it with XP gems and upgrade choices:

- A bounded forest arena with an isometric follow camera.
- Bernardo represented by a recognizable procedural placeholder.
- Keyboard movement on the XZ plane.
- Skeleton Warriors that spawn, pursue, and deal contact or melee damage.
- Automatic Magic Pulse, with Lightning Sword unlockable from level-up.
- Player and enemy health, death, game-over, and restart.
- XP gems, leveling, and a paused three-choice upgrade overlay.

Explicitly **not** in this slice: additional skeleton types, audio, final models, the Siren King, mobile controls, and persistence.

## 6. Bernardo

### Confirmed character

- Young stylized cartoon adventurer.
- Inspired by a real child; only original stylized public assets may ship.
- Short, slightly messy dark hair.
- Expressive face.
- Yellow and white shirt.
- Blue shorts.
- Stylized cartoon proportions.

### Confirmed player rules

- One player entity per run.
- Smooth movement at a consistent configured speed.
- Compatible with an isometric follow camera.
- Has health. Reaching zero ends the run.
- Abilities, damage feedback, and animation states exist. Poses are render-only; simulation still owns position.

### Animations

Procedural limb poses on the placeholder mesh. A later GLB can reuse the same pose names.

| Animation | Intent            | Status                          |
| --------- | ----------------- | ------------------------------- |
| Idle      | Default pose      | Implemented (procedural bob)    |
| Walk      | Locomotion        | Implemented (arm/leg swing)     |
| Attack    | Primary attack    | World VFX; no Bernardo attack pose |
| Hit       | Damage reaction   | Implemented (brief shake)       |
| Victory   | Boss defeated     | Planned                         |
| Defeat    | Run failed        | Implemented (tilt)              |
| Dodge     | Optional flourish | Not a confirmed control         |

Dodge is **not** a confirmed gameplay action. Early movement is walk/run only.

## 7. Camera and Controls

### Confirmed

- Isometric 3D camera that follows Bernardo.
- Fixed orientation during the initial slice. The player does not free-look.
- Desktop keyboard is the primary control scheme.

### Planned desktop input

| Input                 | Action                                | Status                   |
| --------------------- | ------------------------------------- | ------------------------ |
| W A S D or arrow keys | Move on the XZ plane, camera-relative | Implemented              |
| Escape                | Pause / resume                        | Planned with UI          |
| Level-up UI           | Mouse or keys 1–3                     | Implemented              |

Attack keys are not required for the automatic combat model.

### Planned secondary platform

Mobile browsers and touch movement are desired later. Input should be expressed as a movement intent so touch can be added without rewriting simulation.

## 8. World

### Confirmed

- Setting: enchanted forest.
- First arena: a readable, bounded playable area. The player cannot leave the combat space.
- Visual direction: stylized 3D cartoon, readable silhouettes, soft moonlight, colorful abilities, no photorealism.

### Planned

- Atmospheric fog and lighting polish.
- Environmental props that do not block readability.
- Later arenas or arena variants only if the forest slice is already fun.

The world is a gameplay arena, not an open-world exploration game.

## 9. Enemies

All regular enemies are skeletons. **Do not introduce zombies.**

| Enemy            | Behavior                                  | Threat    | Status      |
| ---------------- | ----------------------------------------- | --------- | ----------- |
| Skeleton Warrior | Approaches and attacks at close range     | Low       | Implemented |
| Skeleton Runner  | Faster pursuit                            | Medium    | Planned     |
| Skeleton Archer  | Ranged attacks                            | Medium    | Planned     |
| Skeleton Mage    | Magical projectiles                       | High      | Planned     |
| Skeleton Brute   | Slow, high health and damage              | High      | Planned     |
| Elite Skeleton   | Enhanced attributes and special abilities | Very High | Planned     |

### Confirmed AI approach

Lightweight state machines suitable for large crowds. Avoid expensive pathfinding in the first implementations.

Planned states for a warrior: spawn → pursue → attack → stagger/hit → die.

### Planned crowd features

- Player detection and pursuit.
- Attack cooldowns.
- Damage reactions and death.
- Difficulty scaling.
- Spawn management.
- Elite rewards after Phase 3.

## 10. Combat

### Confirmed

- Attacks are automatic.
- The player wins fights through movement, spacing, and later ability choices.
- Combat must support target selection, cooldowns, damage, health reduction, enemy death, and visible feedback.
- Gameplay rules are data-driven and testable without rendering.

### Planned combat features

- Projectile attacks.
- Area attacks.
- Ability modifiers.
- Knockback and other crowd-control effects, if they remain readable.

### First combat slice

One nearby automatic attack against Skeleton Warriors is enough. Additional attack types wait until that loop is fun.

Combat values live in `src/config/combat.ts` and `src/config/abilities.ts`. They are a first-pass balance, not a final tune.

Implemented now:

- Automatic short-range Magic Pulse. Nearest living target in range; ties use the lower enemy id.
- Optional Lightning Sword: automatic forward arc slash with its own cooldown. Pulse and sword can fire in the same step. An enemy already slain this step cannot drop XP or increment kills again.
- Skeleton Warrior contact damage with a player invulnerability window.
- One contact hit is applied per window, even if several skeletons overlap.
- Game over at zero health, with a kill count and in-session restart.
- Magic Pulse shows expanding gold/cyan rings and a brief impact flash. Lightning Sword shows a cyan directional slash. Hit flashes and a small configurable camera shake are render-only.

## 11. Progression

### Confirmed intent

- Defeated enemies grant experience.
- Experience crystals can be collected.
- Leveling up pauses the run and presents upgrade choices.
- Abilities are configurable and extensible.

### Implemented in Phase 4

- Each slain Skeleton Warrior drops one XP gem (`XP_PER_GEM = 10`) at its death position.
- Gems are collected on the XZ plane inside `pickupRadius`. They do not block movement.
- Inside `pickupRadius * GEM_ATTRACT_MULTIPLIER`, gems move toward Bernardo in simulation. Pickup still happens only inside `pickupRadius`, once.
- Hitting `MAX_ACTIVE_GEMS` merges the closest gems and preserves total XP. Overflow is never granted silently.
- XP is integer. Threshold for level `n → n+1` is `20 + (n - 1) * 10`. Excess XP carries over. One award can cross several levels.
- Each earned level grants exactly one upgrade choice, processed sequentially.
- Simulation pauses for the overlay: no movement, spawn, attacks, contact damage, or survival-time advance. Rendering may continue. See ADR 0007.
- Three distinct eligible upgrades are offered when the pool is large enough. Maxed upgrades are never offered. Lightning Sword starts locked and can be unlocked from the menu.
- If the pool is empty, pending levels are consumed and the run continues so the overlay cannot soft-lock.
- Restart resets XP, level, abilities, gems, offers, and cooldowns.

Implemented abilities (`src/config/abilities.ts`):

| Ability         | Role                                              | Max level |
| --------------- | ------------------------------------------------- | --------- |
| Magic Pulse     | Starting automatic nearby burst                   | 5         |
| Lightning Sword | Unlockable automatic forward lightning slash      | 4         |
| Swift Boots     | Movement speed                                    | 3         |
| Vitality        | Max HP up, plus a defined HP restore              | 4         |
| Magnet          | Larger XP pickup radius, not enemy collision      | 3         |

Upgrade values are additive table lookups, not unbounded multipliers. Vitality never resets current HP; current HP is clamped to the new maximum.

### Planned later abilities

These remain design concepts, not a commitment to ship all of them:

| Ability         | Intended effect                    |
| --------------- | ---------------------------------- |
| Fireball        | Explosive projectile               |
| Thunder Strike  | Lightning damage                   |
| Dino Guardian   | Attacking companion                |
| Magic Shield    | Temporary protection               |
| Tornado         | Area damage and enemy displacement |

## 12. Difficulty

### Confirmed

Threat should increase during a run. A later run should not feel identical to the opening seconds.

### Planned

- Wave or spawn-director pacing.
- Stronger or more numerous skeletons over time.
- Elite introductions before the boss.
- Spawn interval already decays over survival time (`SPAWN_INTERVAL_DECAY_PER_SECOND`).
- The 10–15 minute full-run target is a pacing goal, not a Phase 4 requirement.

## 13. The Siren King

The Siren King is the final boss and an original creature. Do not copy existing copyrighted monster designs.

### Confirmed identity

- Colossal presence.
- Commands skeletons through sonic powers.
- Unique silhouette, readable telegraphs, and a victory sequence after defeat.

### Planned visual traits

- Elongated colossal body.
- Ancient armor and mechanical elements.
- Crown-like sonic structure.
- Glowing energy crystals.

### Planned phases

| Phase           | Health window | Mechanics                                       |
| --------------- | ------------- | ----------------------------------------------- |
| Awakening       | 100–70%       | Sonic waves and ground attacks                  |
| The Summoning   | 70–30%        | Skeleton reinforcements and area attacks        |
| Final Resonance | 30–0%         | Increased aggression and powerful sonic attacks |

### Planned abilities

- Sonic Blast: directional damaging sound waves.
- Ground Shockwave: expanding shockwaves.
- Skeleton Summoning: additional skeletons.
- Resonance Field: temporary hazardous areas.
- Final Resonance: aggressive final-phase pattern.

The boss is out of scope until Phase 6. Phase values above are design intent and may change in playtesting.

## 14. Victory and Defeat

| Outcome | Condition                                          | Status                      |
| ------- | -------------------------------------------------- | --------------------------- |
| Defeat  | Bernardo's health reaches zero                     | Confirmed                   |
| Victory | Siren King health reaches zero                     | Confirmed for the full game |
| Restart | Player can start a new run after victory or defeat | Confirmed intent            |

There is no confirmed meta-progression between runs in the first public version. Local persistence of settings or unlocks is a later Phase 7 idea, not a confirmed launch requirement.

## 15. User Interface

### Confirmed for early playable builds

- Health must be observable.
- The player must be able to tell that a run has ended.

### Implemented in Phase 5

- Health bar and current/max HP.
- Level, XP bar, and XP values.
- Kill count and survival timer.
- Mute button.
- Level-up overlay with three upgrade cards, mouse and 1–3 keys.
- Game Over overlay with Restart.

### Planned

- Pause menu.
- Settings, including graphics quality later.
- Victory screen.
- Sampled music and accessibility options.

UI is HTML/CSS, not a frontend framework.

## 16. Audio

Planned, not confirmed for the first slice: movement, attack, hit, death, pickup, level-up, boss telegraphs, victory, defeat, and forest music.

Phase 5 uses original synthesized SFX through the Web Audio API (Magic Pulse, Lightning Sword, hit, gem, level-up, upgrade, player hurt, Game Over). Audio unlocks after the first click or key. Mute is on the HUD. Music and Howler.js wait until sampled tracks exist. See ADR 0008.

## 17. Art and Asset Rules

- Stylized 3D cartoon with readable combat.
- Original or correctly licensed assets only.
- Public repository must not contain personal photographs or private reference images.
- Gameplay must keep working with procedural placeholders until GLB assets replace them.

See `ASSETS_LICENSE.md` and `public/assets/README.md`.

## 18. Open Design Questions

These do not block Phase 1 or the first movement slice:

1. Exact arena size and whether props create line-of-sight cover.
2. XP crystals are collected inside a pickup radius. Magnet increases that radius; gems do not yet fly toward Bernardo.
3. Three ability choices appear per level-up when at least three upgrades remain eligible.
4. Whether a run timer or a spawn-director triggers the Siren King.
5. Whether any between-run unlocks exist for the first public release.

Record answers here when they are decided. Do not treat guessed answers as confirmed requirements.
