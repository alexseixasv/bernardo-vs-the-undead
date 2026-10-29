import { DEATH_DURATION, HIT_FLASH_DURATION, PLAYER_HURT_COOLDOWN } from '../config/combat';
import { cloneEnemyState, type EnemyState } from '../entities/enemy';
import { clonePlayerState, createPlayerState, type PlayerState } from '../entities/player';
import type { InputIntent } from '../input/InputIntent';
import { mulberry32, type RandomFn } from '../math/random';
import {
  applyContactDamage,
  autoAttack,
  tickAttackPulse,
  tickEnemyPresentation,
  type AttackPulse,
} from '../systems/CombatSystem';
import { movePlayer } from '../systems/MovementSystem';
import { pursuePlayer } from '../systems/PursuitSystem';
import { createSpawnState, trySpawnSkeleton, type SpawnState } from '../systems/SpawnSystem';

export type RunStatus = 'playing' | 'gameOver';

export interface PlayerSnapshot {
  x: number;
  y: number;
  z: number;
  facingYaw: number;
  health: number;
  maxHealth: number;
  hurtAmount: number;
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
}

export interface WorldSnapshot {
  player: PlayerSnapshot;
  enemies: EnemySnapshot[];
  pulse: AttackPulse | null;
  status: RunStatus;
  kills: number;
  elapsedSeconds: number;
}

export interface WorldOptions {
  random?: RandomFn;
  player?: PlayerState;
  enemies?: EnemyState[];
}

export class World {
  private random: RandomFn;
  private previousPlayer: PlayerState;
  private player: PlayerState;
  private previousEnemies = new Map<number, EnemyState>();
  private enemies: EnemyState[] = [];
  private spawn: SpawnState = createSpawnState();
  private pulse: AttackPulse | null = null;
  private status: RunStatus = 'playing';
  private kills = 0;
  private elapsedSeconds = 0;

  constructor(options: WorldOptions = {}) {
    this.random = options.random ?? mulberry32(20261029);
    this.player = clonePlayerState(options.player ?? createPlayerState());
    this.previousPlayer = clonePlayerState(this.player);
    this.enemies = (options.enemies ?? []).map(cloneEnemyState);
  }

  step(deltaSeconds: number, intent: InputIntent): void {
    if (this.status === 'gameOver') {
      return;
    }

    this.previousPlayer = clonePlayerState(this.player);
    this.previousEnemies = new Map(this.enemies.map((enemy) => [enemy.id, cloneEnemyState(enemy)]));
    this.elapsedSeconds += deltaSeconds;
    this.player = movePlayer(this.player, intent, deltaSeconds);

    const spawned = trySpawnSkeleton(
      this.spawn,
      this.player,
      this.enemies,
      this.elapsedSeconds,
      deltaSeconds,
      this.random,
    );
    this.spawn = spawned.spawn;
    let enemies = spawned.enemy === null ? this.enemies : [...this.enemies, spawned.enemy];

    enemies = enemies.map((enemy) => pursuePlayer(enemy, this.player, deltaSeconds));

    const attack = autoAttack(this.player, enemies, deltaSeconds);
    this.player = attack.player;
    enemies = attack.enemies;
    this.kills += attack.kills;
    this.pulse = attack.pulse ?? tickAttackPulse(this.pulse, deltaSeconds);

    this.player = applyContactDamage(this.player, enemies, deltaSeconds);

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
    }
  }

  reset(): void {
    this.player = createPlayerState();
    this.previousPlayer = clonePlayerState(this.player);
    this.previousEnemies = new Map();
    this.enemies = [];
    this.spawn = createSpawnState();
    this.pulse = null;
    this.status = 'playing';
    this.kills = 0;
    this.elapsedSeconds = 0;
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
      },
      enemies: this.enemies.map((enemy) => this.interpolateEnemy(enemy, alpha)),
      pulse: this.pulse,
      status: this.status,
      kills: this.kills,
      elapsedSeconds: this.elapsedSeconds,
    };
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
    };
  }
}

function lerp(from: number, to: number, alpha: number): number {
  return from + (to - from) * alpha;
}
