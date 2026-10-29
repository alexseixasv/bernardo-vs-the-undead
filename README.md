# 💀 Bernardo vs. The Undead

### Rise of the Siren King

**A 3D browser-based survival roguelite built with Three.js and TypeScript.**

Fight endless hordes of skeletons, unlock powerful abilities, survive an increasingly dangerous enchanted forest, and defeat the legendary Siren King.

Inspired by the fast-paced progression and survival mechanics of _Vampire Survivors_, Bernardo vs. The Undead combines accessible gameplay, stylized 3D graphics, and challenging encounters in a single-player browser experience.

> **Project Status:** Phase 4 complete — survive skeleton warriors, collect XP gems, level up, and choose upgrades. Audio, final models, and the Siren King are not implemented yet.

---

## 🎮 About the Game

Bernardo is a young adventurer who finds himself trapped in a mysterious forest overrun by an army of skeletons.

Armed with courage and an ever-growing collection of magical abilities, he must survive relentless waves of enemies while uncovering the source of the forest's corruption.

Deep within the forest awaits the **Siren King**, an ancient colossal creature whose supernatural sonic powers command the undead.

To escape, Bernardo must become stronger, master new abilities, and defeat the creature responsible for awakening the skeleton army.

### Core Gameplay

- **3D Isometric Perspective:** Explore a stylized forest from an isometric follow camera.
- **Survival Combat:** Face increasingly difficult waves of skeleton enemies.
- **Automatic Attacks:** Focus on movement, positioning, and strategic decisions.
- **Character Progression:** Collect experience and unlock powerful upgrades.
- **Ability Combinations:** Discover different builds through complementary abilities.
- **Enemy Variety:** Encounter skeleton warriors, archers, mages, and elite enemies.
- **Boss Encounter:** Survive long enough to challenge the Siren King.
- **Replayability:** Experiment with different abilities and strategies across multiple runs.
- **Browser-Based:** Play directly in a modern browser without installing a game client.

The detailed gameplay specification lives in [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md). That document marks confirmed requirements separately from later ideas.

### Planned Game Loop

1. Start a new run in the enchanted forest.
2. Move around the arena while automatically attacking nearby enemies.
3. Defeat skeletons and collect experience crystals.
4. Level up and choose new abilities or upgrade existing ones.
5. Survive increasingly challenging enemy waves.
6. Defeat elite skeletons and collect special rewards.
7. Face the Siren King in the final encounter.
8. Defeat the boss to complete the run.

The initial target is a **10–15 minute gameplay experience**, subject to playtesting and balancing.

---

## 👦 Meet Bernardo

Bernardo is the main playable character and the hero of the adventure.

His design is inspired by a real child and adapted into a stylized, expressive 3D cartoon character.

### Character Design

- Short, slightly messy dark hair.
- Expressive facial features.
- Yellow and white shirt.
- Blue shorts.
- Stylized cartoon proportions.
- Playful movement and combat animations.

### Planned Animations

| Animation | Description                          |
| --------- | ------------------------------------ |
| Idle      | Default standing animation           |
| Run       | Character movement                   |
| Attack    | Primary attack animation             |
| Hit       | Damage reaction                      |
| Dodge     | Evasive movement                     |
| Victory   | Celebration after defeating the boss |
| Defeat    | End-of-run animation                 |

The character will use a reusable animation system based on Three.js `AnimationMixer`.

Character models and animations will be loaded from external GLB assets to keep gameplay logic independent of visual assets.

---

## 💀 Enemy System

The forest is populated by different types of skeletons, each introducing unique combat challenges.

| Enemy            | Behavior                                  | Threat    |
| ---------------- | ----------------------------------------- | --------- |
| Skeleton Warrior | Approaches and attacks at close range     | Low       |
| Skeleton Runner  | Moves quickly toward the player           | Medium    |
| Skeleton Archer  | Attacks from a distance                   | Medium    |
| Skeleton Mage    | Casts magical projectiles                 | High      |
| Skeleton Brute   | Slow movement, high health and damage     | High      |
| Elite Skeleton   | Enhanced attributes and special abilities | Very High |

The first combat prototype uses Skeleton Warriors only. Additional types are introduced after that slice is playable.

### Enemy AI

The planned enemy behavior system will support:

- Player detection and pursuit.
- Movement and attack states.
- Different movement speeds.
- Attack cooldowns.
- Damage reactions.
- Death animations.
- Difficulty scaling.
- Spawn management.

Enemy behaviors will be designed around lightweight state machines to support large numbers of active enemies efficiently.

---

## 👑 The Siren King

The Siren King is the final boss and the primary antagonist.

An ancient guardian corrupted by supernatural energy, the Siren King commands the skeleton army through devastating sonic powers.

### Visual Identity

The Siren King is an original creature featuring:

- A colossal, elongated silhouette.
- Ancient armor and mechanical elements.
- A distinctive crown-like sonic structure.
- Glowing energy crystals.
- Powerful sound-based attacks.
- An intimidating presence towering above the forest.

### Boss Encounter

The encounter is planned around three combat phases.

| Phase           | Health  | Mechanics                                       |
| --------------- | ------- | ----------------------------------------------- |
| Awakening       | 100–70% | Sonic waves and ground attacks                  |
| The Summoning   | 70–30%  | Skeleton reinforcements and area attacks        |
| Final Resonance | 30–0%   | Increased aggression and powerful sonic attacks |

### Planned Boss Abilities

**Sonic Blast:** Emits directional sound waves that damage the player.

**Ground Shockwave:** Creates expanding shockwaves around the boss.

**Skeleton Summoning:** Calls additional skeletons into the arena.

**Resonance Field:** Creates temporary hazardous areas.

**Final Resonance:** Activates a more aggressive attack pattern during the final phase.

The encounter should emphasize readable attack patterns, movement, positioning, and visual feedback.

---

## ⚔️ Abilities and Progression

Bernardo becomes stronger throughout each run by collecting experience and unlocking abilities.

### Initial Ability Concepts

| Ability         | Effect                                    |
| --------------- | ----------------------------------------- |
| Lightning Sword | Automatically attacks nearby enemies      |
| Fireball        | Launches explosive magical projectiles    |
| Thunder Strike  | Damages enemies with lightning            |
| Dino Guardian   | Summons a companion that attacks enemies  |
| Magic Shield    | Provides temporary protection             |
| Tornado         | Pushes enemies away and deals area damage |

### Upgrade System

Abilities are planned to support multiple upgrade levels.

Upgrades may modify:

- Damage.
- Attack speed.
- Projectile count.
- Attack range.
- Area of effect.
- Duration.
- Special effects.

The progression system should be data-driven, allowing new abilities and upgrades to be introduced without modifying core combat logic.

---

## 🛠️ Technology Stack

The project prioritizes modern web technologies, modular architecture, performance, and maintainability.

| Category            | Technology                                                   |
| ------------------- | ------------------------------------------------------------ |
| Language            | TypeScript                                                   |
| 3D Rendering        | Three.js                                                     |
| Development & Build | Vite                                                         |
| Physics             | Simplified gameplay collision first; Rapier only if required |
| Audio               | Howler.js, when audio is introduced                          |
| UI                  | HTML5 / CSS3                                                 |
| Unit Testing        | Vitest                                                       |
| End-to-End Testing  | Playwright, when a playable scene exists                     |
| Code Quality        | ESLint / Prettier                                            |
| Automation          | GitHub Actions                                               |
| Deployment          | Cloudflare Pages                                             |
| 3D Assets           | Blender / GLTF / GLB                                         |
| Local Persistence   | IndexedDB, if local saves are added                          |

### Why Three.js?

Three.js provides a flexible foundation for browser-based 3D rendering.

It allows the project to implement custom gameplay systems while maintaining direct control over rendering, scene management, cameras, lighting, and animations.

### Why TypeScript?

TypeScript provides strong typing, improved maintainability, and better development tooling.

The project will use strict TypeScript configuration to encourage explicit contracts and predictable behavior.

### Why No Backend?

The initial release is designed as a fully client-side single-player experience.

Gameplay, progression, and local persistence will run directly in the browser.

A backend may be introduced later if features such as online leaderboards or cloud saves become necessary.

---

## 🏗️ Architecture

The project will follow a modular architecture separating gameplay logic, rendering, input handling, audio, and user interface components.

The current architecture plan, including what is not yet implemented, is documented in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Architectural decisions are recorded in [`docs/decisions/`](docs/decisions/).

### Architectural Principles

1. **Separation of Concerns:** Gameplay rules should not depend directly on rendering implementations.
2. **Composition Over Inheritance:** Prefer reusable behaviors and components over deep inheritance hierarchies.
3. **Data-Driven Design:** Define abilities, enemies, and balancing parameters through typed configuration.
4. **Deterministic Logic:** Keep gameplay calculations testable independently from rendering.
5. **Performance Awareness:** Design systems to support large numbers of simultaneous enemies.
6. **Incremental Development:** Introduce abstractions only when justified by actual requirements.
7. **Asset Independence:** Keep 3D models and animations replaceable without rewriting gameplay systems.

### Planned Project Structure

```text
bernardo-vs-the-undead/
├── public/
│   └── assets/
│       ├── characters/
│       │   └── bernardo/
│       ├── enemies/
│       ├── bosses/
│       ├── environments/
│       ├── audio/
│       └── textures/
│
├── src/
│   ├── core/
│   │   ├── Game.ts
│   │   ├── GameLoop.ts
│   │   ├── EventBus.ts
│   │   └── SceneManager.ts
│   │
│   ├── entities/
│   │   ├── player/
│   │   ├── enemies/
│   │   └── bosses/
│   │
│   ├── systems/
│   │   ├── MovementSystem.ts
│   │   ├── CombatSystem.ts
│   │   ├── CollisionSystem.ts
│   │   ├── SpawnSystem.ts
│   │   └── ProgressionSystem.ts
│   │
│   ├── abilities/
│   ├── world/
│   ├── rendering/
│   ├── input/
│   ├── audio/
│   ├── ui/
│   ├── config/
│   ├── types/
│   └── main.ts
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docs/
│   ├── GAME_DESIGN.md
│   ├── ARCHITECTURE.md
│   ├── ROADMAP.md
│   ├── PERFORMANCE.md
│   └── decisions/
│
├── .github/
│   └── workflows/
│
├── AGENTS.md
├── README.md
├── LICENSE
├── package.json
├── tsconfig.json
└── vite.config.ts
```

> This structure represents the intended architecture. Directories and components will be introduced incrementally as features are implemented.

---

## ⚡ Performance Strategy

One of the project's primary technical challenges is rendering and simulating large groups of skeleton enemies in real time.

### Planned Optimizations

**Object Pooling**

Reuse enemy instances, projectiles, and temporary effects to reduce allocation overhead.

**Instanced Rendering**

Use Three.js `InstancedMesh` where appropriate to reduce draw calls for repeated geometry.

**Spatial Partitioning**

Use spatial grids or similar structures to optimize nearby-entity queries and collision detection.

**Simplified Collision Shapes**

Prefer lightweight collision representations for enemies and projectiles instead of complex mesh-based physics.

**Adaptive Effects**

Limit particles and visual effects according to performance requirements.

**Efficient AI Updates**

Avoid expensive pathfinding and unnecessary per-frame calculations for large enemy groups.

### Performance Goals

Initial performance targets:

| Metric                  | Target                            |
| ----------------------- | --------------------------------- |
| Desktop Frame Rate      | 60 FPS                            |
| Active Enemies          | 200+                              |
| Gameplay Responsiveness | Consistent input handling         |
| Loading                 | Optimized assets and lazy loading |
| Memory                  | Stable usage across repeated runs |

These are engineering targets, not verified benchmarks.

Actual performance will be measured on documented hardware and browser configurations.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 22 LTS (see `.nvmrc`)
- npm
- A modern browser supporting WebGL2
- Git

### Local Development

```bash
git clone <repository-url>

cd bernardo-vs-the-undead

npm install

npm run dev
```

Open the local URL displayed by Vite. Move with WASD or the arrow keys. Bernardo attacks nearby skeletons automatically. Defeated skeletons drop XP gems. Level-ups pause the run and present three upgrade cards (click or press 1–3).

### Production Build

```bash
npm run build

npm run preview
```

### Run Unit Tests

```bash
npm run test
```

End-to-end tests are not configured yet. Playwright will be added when a playable scene exists.

### Code Quality

```bash
npm run lint

npm run typecheck

npm run format
```

---

## 🧪 Testing Strategy

The project will include automated testing for gameplay logic and critical user interactions.

### Unit Tests

Planned coverage includes:

- Damage calculations.
- Health management.
- Experience progression.
- Ability upgrades.
- Enemy spawning rules.
- Cooldown calculations.
- Boss phase transitions.

### Integration Tests

Planned coverage includes interactions between:

- Combat and health systems.
- Enemy spawning and difficulty progression.
- Experience collection and ability upgrades.
- Player state and UI updates.

### End-to-End Tests

Playwright will be used to validate critical browser interactions, including:

- Game initialization.
- Starting a new run.
- Player movement.
- Pause and resume.
- Game-over transitions.
- Restarting a run.

The testing strategy will prioritize deterministic gameplay logic over fragile visual assertions.

---

## 🗺️ Development Roadmap

The game will be developed incrementally through independently testable milestones. Detailed acceptance criteria live in [`docs/ROADMAP.md`](docs/ROADMAP.md).

### Phase 0 — Pre-production

- [x] Finalize the Game Design Document.
- [x] Define the initial playable scope.
- [x] Establish architectural guidelines.
- [x] Define the visual direction.
- [x] Document character design requirements.

### Phase 1 — Technical Foundation

- [x] Initialize Vite and TypeScript.
- [x] Configure Three.js.
- [x] Implement a fixed-timestep game loop.
- [x] Configure testing and linting.
- [x] Set up GitHub Actions.

### Phase 2 — First Playable Scene

- [x] Create the initial forest arena.
- [x] Implement an isometric camera.
- [x] Add player movement.
- [x] Implement basic collisions.
- [x] Add placeholder character assets.

### Phase 3 — Combat Prototype

- [x] Implement basic skeleton enemies.
- [x] Add enemy spawning.
- [x] Implement enemy pursuit behavior.
- [x] Add automatic attacks.
- [x] Implement health and damage.
- [x] Add enemy death effects.

### Phase 4 — Progression

- [x] Implement experience collection.
- [x] Add character leveling.
- [x] Implement ability selection.
- [x] Add upgradeable abilities.
- [x] Introduce difficulty scaling.

### Phase 5 — Visual Identity

- [ ] Integrate Bernardo's final 3D model.
- [ ] Add character animations.
- [ ] Introduce additional skeleton variants.
- [ ] Improve environmental assets.
- [ ] Add sound effects and music.

### Phase 6 — Siren King

- [ ] Create the original Siren King model.
- [ ] Implement boss AI.
- [ ] Implement three combat phases.
- [ ] Add boss-specific visual effects.
- [ ] Implement the victory sequence.

### Phase 7 — Polish and Optimization

- [ ] Optimize enemy rendering.
- [ ] Improve collision performance.
- [ ] Add graphics settings.
- [ ] Implement optional local persistence.
- [ ] Add accessibility improvements.
- [ ] Improve loading performance.

### Phase 8 — Public Release

- [ ] Complete automated testing.
- [ ] Review architecture documentation for the public build.
- [ ] Add gameplay screenshots and videos.
- [ ] Configure production deployment.
- [ ] Publish the playable browser version.

---

## 🤖 AI-Assisted Development

This project uses an AI-assisted engineering workflow with Cursor.

The objective is not simply to generate code, but to maintain a structured and reviewable development process.

### Engineering Workflow

Each major feature should follow this cycle:

**Research → Plan → Implement → Test → Review → Document → Learn**

### Development Guidelines

- Define requirements before implementation.
- Break large features into manageable tasks.
- Keep changes focused and reviewable.
- Validate functionality with automated tests.
- Document important architectural decisions.
- Avoid unnecessary dependencies and abstractions.
- Preserve working functionality during refactoring.
- Capture lessons learned to improve future development.

Project-specific AI development instructions are maintained in [`AGENTS.md`](AGENTS.md).

Architectural decisions will be documented in `docs/decisions/`.

---

## 📚 Documentation

The following documentation will be maintained as the project evolves:

| Document               | Purpose                                                              |
| ---------------------- | -------------------------------------------------------------------- |
| `README.md`            | Project overview and setup                                           |
| `AGENTS.md`            | AI-assisted development guidelines                                   |
| `docs/GAME_DESIGN.md`  | Gameplay mechanics and balancing                                     |
| `docs/ARCHITECTURE.md` | Technical architecture                                               |
| `docs/ROADMAP.md`      | Development milestones                                               |
| `docs/PERFORMANCE.md`  | Performance strategy and benchmarks, created when measurements exist |
| `docs/decisions/`      | Architecture Decision Records                                        |

---

## 🎨 Art Direction

The game uses a stylized 3D cartoon aesthetic with a slightly dark fantasy atmosphere.

### Visual Characteristics

- Expressive cartoon characters.
- Stylized skeleton enemies.
- Atmospheric forest environments.
- Soft moonlight and volumetric-style fog effects.
- Colorful magical abilities.
- Readable combat animations.
- Distinct silhouettes for enemies and bosses.

The visual direction prioritizes gameplay readability and performance over photorealism.

### Asset Guidelines

Game assets should:

- Be original or appropriately licensed.
- Use optimized geometry and textures.
- Prefer GLB/GLTF for 3D models.
- Follow consistent naming conventions.
- Avoid unnecessary polygon complexity.
- Support reusable animation workflows.

---

## 🤝 Contributing

Contributions will be welcome as the project matures.

Potential contribution areas include:

- Gameplay mechanics.
- Performance optimization.
- 3D modeling and animation.
- Sound design.
- Accessibility.
- Automated testing.
- Documentation.

Contribution guidelines and issue templates will be introduced when the initial project foundation is stable.

---

## 🔐 Privacy and Asset Ownership

The playable character is inspired by a real child, but the project is intended to use an original stylized representation.

Personal photographs and private reference materials are not intended to be distributed in the public repository.

All third-party assets must have licenses compatible with their intended use and distribution.

The Siren King is intended to be an original fictional character with its own visual identity, story, and abilities.

---

## 📄 License

**Bernardo vs. The Undead** uses separate licenses for source code and original creative assets.

### Source Code

The source code is available under the [MIT License](LICENSE).

Developers are free to use, modify, distribute, and commercially use the source code in accordance with the MIT License.

### Game Assets

Original characters, 3D models, animations, artwork, music, sound effects, and other creative assets are not automatically covered by the MIT License.

These assets are subject to the terms described in [ASSETS_LICENSE.md](ASSETS_LICENSE.md).

### Third-Party Assets

Third-party assets remain subject to their respective licenses.

Attribution and licensing information will be maintained in the [Asset Documentation](public/assets/README.md).

### Personal Reference Materials

Personal photographs and private reference materials are excluded from the public repository.

---

**Code is open source. Original creative assets remain protected.**
---

## ❤️ A Personal Project

Bernardo vs. The Undead started with a simple idea:

**What if a little boy could become the hero of his own video game?**

Created as a personal project and engineering playground, the game combines a love for software development with the joy of building something special for family.

Beyond the gameplay, the project is an opportunity to explore real-time rendering, game architecture, performance engineering, automated testing, and modern AI-assisted development workflows.

**Built with ❤️, TypeScript, and a lot of skeletons.**

---

_Bernardo vs. The Undead: Rise of the Siren King_

**One little hero. Endless skeletons. One legendary boss.**
