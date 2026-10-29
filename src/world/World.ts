import { deriveCombatStats } from '../config/abilities';
import { DEATH_DURATION, HIT_FLASH_DURATION, PLAYER_HURT_COOLDOWN } from '../config/combat';
import { MAX_ACTIVE_SKELETONS } from '../config/combat';
import { XP_PER_GEM } from '../config/progression';
import { ARENA_HALF_EXTENT } from '../config/world';
import { cloneEnemyState, type EnemyState } from '../entities/enemy';
import { clonePlayerState, createPlayerState, type PlayerState } from '../entities/player';
import { cloneXpGem, type XpGem } from '../entities/xpGem';
import type { InputIntent } from '../input/InputIntent';
import { mulberry32, type RandomFn } from '../math/random';
import { applyUpgrade, generateUpgradeOffers, type UpgradeOffer } from '../systems/AbilitySystem';
import {
  applyContactDamage,
  autoAttack,
  lightningSwordAttack,
  tickAttackPulse,
  tickEnemyPresentation,
  tickSwordSlash,
  type AttackPulse,
  type SwordSlash,
} from '../systems/CombatSystem';
import { movePlayer } from '../systems/MovementSystem';
import {
  applyExperienceToPlayer,
  attractGems,
  collectGems,
  dropGemsForDeaths,
  type CombatDeath,
} from '../systems/ProgressionSystem';
import { pursuePlayer } from '../systems/PursuitSystem';
import { createSpawnState, trySpawnSkeleton, type SpawnState } from '../systems/SpawnSystem';

export type RunStatus = 'playing' | 'levelUp' | 'gameOver';

export interface PlayerSnapshot {
  x: number;
  y: number;
  z: number;
  facingYaw: number;
  health: number;
  maxHealth: number;
  hurtAmount: number;
  moving: boolean;
  radius: number;
  level: number;
  xp: number;
  xpToNext: number;
  pendingLevelUps: number;
}

export interface EnemySnapshot {
  id: number;
  x: number;
  y: number;
  z: number;
  facingYaw: number;
  lifecycle: EnemyState['lifecycle'];
  hitAmount: number;
  deathAmount: number;
  moving: boolean;
  contacting: boolean;
}

export interface GemSnapshot {
  id: number;
  x: number;
  z: number;
  xp: number;
}

export interface WorldSnapshot {
  player: PlayerSnapshot;
  enemies: EnemySnapshot[];
  gems: GemSnapshot[];
  pulse: AttackPulse | null;
  slash: SwordSlash | null;
  offers: UpgradeOffer[];
  status: RunStatus;
  kills: number;
  elapsedSeconds: number;
}

export interface WorldOptions {
  random?: RandomFn;
  player?: PlayerState;
  enemies?: EnemyState[];
  gems?: XpGem[];
  maxActiveSkeletons?: number;
  stressFill?: boolean;
  benchmark?: boolean;
}

export class World {
  private random: RandomFn;
  private previousPlayer: PlayerState;
  private player: PlayerState;
  private previousEnemies = new Map<number, { x: number; y: number; z: number }>();
  private enemies: EnemyState[] = [];
  private gems: XpGem[] = [];
  private spawn: SpawnState = createSpawnState();
  private pulse: AttackPulse | null = null;
  private slash: SwordSlash | null = null;
  private offers: UpgradeOffer[] = [];
  private status: RunStatus = 'playing';
  private kills = 0;
  private elapsedSeconds = 0;
  private nextGemId = 1;
  private previousGems = new Map<number, { x: number; z: number }>();
  private readonly maxActiveSkeletons: number;
  private readonly stressFill: boolean;
  private readonly benchmark: boolean;

  constructor(options: WorldOptions = {}) {
    this.random = options.random ?? mulberry32(20261029);
    this.player = clonePlayerState(options.player ?? createPlayerState());
    this.previousPlayer = clonePlayerState(this.player);
    this.enemies = (options.enemies ?? []).map(cloneEnemyState);
    this.gems = (options.gems ?? []).map(cloneXpGem);
    this.maxActiveSkeletons = options.maxActiveSkeletons ?? MAX_ACTIVE_SKELETONS;
    this.stressFill = options.stressFill === true;
    this.benchmark = options.benchmark === true;
    if (this.stressFill) {
      this.spawn = createSpawnState();
      this.spawn.cooldown = 0;
    }
  }

  step(deltaSeconds: number, intent: InputIntent): void {
    if (this.status !== 'playing') {
      return;
    }

    this.previousPlayer = clonePlayerState(this.player);
    this.previousEnemies = new Map(
      this.enemies.map((enemy) => [enemy.id, { x: enemy.x, y: enemy.y, z: enemy.z }]),
    );
    this.previousGems = new Map(this.gems.map((gem) => [gem.id, { x: gem.x, z: gem.z }]));
    this.elapsedSeconds += deltaSeconds;

    const stats = deriveCombatStats(this.player.abilities);
    this.player = movePlayer(this.player, intent, deltaSeconds, {
      speed: stats.moveSpeed,
      arenaHalfExtent: ARENA_HALF_EXTENT,
    });

    const spawned = trySpawnSkeleton(
      this.spawn,
      this.player,
      this.enemies,
      this.elapsedSeconds,
      deltaSeconds,
      this.random,
      this.maxActiveSkeletons,
    );
    this.spawn = spawned.spawn;
    let enemies = spawned.enemy === null ? this.enemies : [...this.enemies, spawned.enemy];
    if (this.stressFill) {
      for (let extra = 0; extra < 8; extra += 1) {
        this.spawn.cooldown = 0;
        const burst = trySpawnSkeleton(
          this.spawn,
          this.player,
          enemies,
          this.elapsedSeconds,
          deltaSeconds,
          this.random,
          this.maxActiveSkeletons,
        );
        this.spawn = burst.spawn;
        if (burst.enemy === null) {
          break;
        }
        enemies = [...enemies, burst.enemy];
      }
    }

    enemies = enemies.map((enemy) => pursuePlayer(enemy, this.player, deltaSeconds));

    const pulse = autoAttack(this.player, enemies, deltaSeconds);
    this.player = pulse.player;
    enemies = pulse.enemies;

    const sword = lightningSwordAttack(this.player, enemies, deltaSeconds);
    this.player = sword.player;
    enemies = sword.enemies;

    const deaths = uniqueDeaths(pulse.deaths, sword.deaths);
    this.kills += deaths.length;
    this.pulse = pulse.pulse ?? tickAttackPulse(this.pulse, deltaSeconds);
    this.slash = sword.slash ?? tickSwordSlash(this.slash, deltaSeconds);

    if (!this.benchmark) {
      this.player = applyContactDamage(this.player, enemies, deltaSeconds);
    }

    const dropped = dropGemsForDeaths(this.gems, deaths, this.nextGemId, XP_PER_GEM);
    this.nextGemId = dropped.nextId;
    let gems = attractGems(this.player, dropped.gems, stats.pickupRadius, deltaSeconds);

    const collected = collectGems(this.player, gems, stats.pickupRadius);
    gems = collected.gems;
    this.gems = gems;
    if (collected.gainedXp > 0) {
      this.player = applyExperienceToPlayer(this.player, collected.gainedXp);
    }

    const remaining: EnemyState[] = [];
    for (const enemy of enemies) {
      const next = tickEnemyPresentation(enemy, deltaSeconds);
      if (next !== null) {
        remaining.push(next);
      }
    }
    this.enemies = remaining;

    if (this.player.health <= 0) {
      this.status = 'gameOver';
      this.offers = [];
      return;
    }

    if (this.player.pendingLevelUps > 0) {
      if (this.benchmark) {
        this.player = { ...this.player, pendingLevelUps: 0 };
      } else {
        this.beginLevelUp();
      }
    }
  }

  chooseUpgrade(index: number): boolean {
    if (this.status !== 'levelUp') {
      return false;
    }

    const offer = this.offers[index];
    if (offer === undefined) {
      return false;
    }

    this.offers = [];
    this.player = applyUpgrade(this.player, offer.id);
    this.player = {
      ...this.player,
      pendingLevelUps: Math.max(0, this.player.pendingLevelUps - 1),
    };

    if (this.player.pendingLevelUps > 0) {
      this.beginLevelUp();
      return true;
    }

    this.status = 'playing';
    return true;
  }

  reset(): void {
    this.player = createPlayerState();
    this.previousPlayer = clonePlayerState(this.player);
    this.previousEnemies = new Map();
    this.enemies = [];
    this.gems = [];
    this.previousGems = new Map();
    this.spawn = createSpawnState();
    if (this.stressFill) {
      this.spawn.cooldown = 0;
    }
    this.pulse = null;
    this.slash = null;
    this.offers = [];
    this.status = 'playing';
    this.kills = 0;
    this.elapsedSeconds = 0;
    this.nextGemId = 1;
  }

  getStatus(): RunStatus {
    return this.status;
  }

  getKills(): number {
    return this.kills;
  }

  getElapsedSeconds(): number {
    return this.elapsedSeconds;
  }

  getPlayer(): PlayerState {
    return clonePlayerState(this.player);
  }

  getEnemies(): EnemyState[] {
    return this.enemies.map(cloneEnemyState);
  }

  getGems(): XpGem[] {
    return this.gems.map(cloneXpGem);
  }

  getOffers(): UpgradeOffer[] {
    return this.offers.map((offer) => ({ ...offer }));
  }

  getSnapshot(interpolationAlpha: number): WorldSnapshot {
    const alpha = Math.min(1, Math.max(0, interpolationAlpha));
    return {
      player: {
        x: lerp(this.previousPlayer.x, this.player.x, alpha),
        y: lerp(this.previousPlayer.y, this.player.y, alpha),
        z: lerp(this.previousPlayer.z, this.player.z, alpha),
        facingYaw: this.player.facingYaw,
        health: this.player.health,
        maxHealth: this.player.maxHealth,
        hurtAmount:
          this.player.hurtCooldown > 0
            ? Math.min(1, this.player.hurtCooldown / PLAYER_HURT_COOLDOWN)
            : 0,
        moving:
          Math.hypot(this.player.x - this.previousPlayer.x, this.player.z - this.previousPlayer.z) >
          1e-4,
        radius: this.player.radius,
        level: this.player.level,
        xp: this.player.xp,
        xpToNext: this.player.xpToNext,
        pendingLevelUps: this.player.pendingLevelUps,
      },
      enemies: this.enemies.map((enemy) => this.interpolateEnemy(enemy, alpha)),
      gems: this.gems.map((gem) => this.interpolateGem(gem, alpha)),
      pulse: this.pulse,
      slash: this.slash,
      offers: this.getOffers(),
      status: this.status,
      kills: this.kills,
      elapsedSeconds: this.elapsedSeconds,
    };
  }

  private beginLevelUp(): void {
    this.offers = generateUpgradeOffers(this.player.abilities, this.random);
    if (this.offers.length === 0) {
      this.player = { ...this.player, pendingLevelUps: 0 };
      this.status = 'playing';
      return;
    }

    this.status = 'levelUp';
  }

  private interpolateEnemy(enemy: EnemyState, alpha: number): EnemySnapshot {
    const previous = this.previousEnemies.get(enemy.id) ?? enemy;
    return {
      id: enemy.id,
      x: lerp(previous.x, enemy.x, alpha),
      y: lerp(previous.y, enemy.y, alpha),
      z: lerp(previous.z, enemy.z, alpha),
      facingYaw: enemy.facingYaw,
      lifecycle: enemy.lifecycle,
      hitAmount: enemy.hitFlash > 0 ? Math.min(1, enemy.hitFlash / HIT_FLASH_DURATION) : 0,
      deathAmount:
        enemy.lifecycle === 'dead' && enemy.deathTimer > 0
          ? 1 - enemy.deathTimer / DEATH_DURATION
          : 0,
      moving: Math.hypot(enemy.x - previous.x, enemy.z - previous.z) > 1e-4,
      contacting:
        enemy.lifecycle === 'alive' &&
        Math.hypot(enemy.x - this.player.x, enemy.z - this.player.z) <=
          this.player.radius + enemy.radius + 0.04,
    };
  }

  private interpolateGem(gem: XpGem, alpha: number): GemSnapshot {
    const previous = this.previousGems.get(gem.id) ?? gem;
    return {
      id: gem.id,
      x: lerp(previous.x, gem.x, alpha),
      z: lerp(previous.z, gem.z, alpha),
      xp: gem.xp,
    };
  }
}

function uniqueDeaths(
  pulseDeaths: readonly CombatDeath[],
  swordDeaths: readonly CombatDeath[],
): CombatDeath[] {
  const seen = new Set<number>();
  const deaths: CombatDeath[] = [];
  for (const death of [...pulseDeaths, ...swordDeaths]) {
    if (seen.has(death.id)) {
      continue;
    }
    seen.add(death.id);
    deaths.push(death);
  }
  return deaths;
}

function lerp(from: number, to: number, alpha: number): number {
  return from + (to - from) * alpha;
}
