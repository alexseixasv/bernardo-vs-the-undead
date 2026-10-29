import type { WorldSnapshot } from '../world/World';

export class Hud {
  private readonly healthFill: HTMLElement | null;
  private readonly healthText: HTMLElement | null;
  private readonly killCount: HTMLElement | null;
  private readonly runTime: HTMLElement | null;
  private readonly gameOver: HTMLElement | null;
  private readonly gameOverKills: HTMLElement | null;
  private readonly restartButton: HTMLButtonElement | null;
  private readonly onRestart: () => void;

  private lastHealth = Number.NaN;
  private lastKills = Number.NaN;
  private lastTimeKey = '';
  private lastStatus: WorldSnapshot['status'] | null = null;

  constructor(onRestart: () => void) {
    this.onRestart = onRestart;
    this.healthFill = document.getElementById('health-fill');
    this.healthText = document.getElementById('health-text');
    this.killCount = document.getElementById('kill-count');
    this.runTime = document.getElementById('run-time');
    this.gameOver = document.getElementById('game-over');
    this.gameOverKills = document.getElementById('game-over-kills');
    const button = document.getElementById('restart-button');
    this.restartButton = button instanceof HTMLButtonElement ? button : null;
    this.restartButton?.addEventListener('click', this.handleRestart);
  }

  sync(snapshot: WorldSnapshot): void {
    const health = Math.max(0, snapshot.player.health);
    if (health !== this.lastHealth) {
      this.lastHealth = health;
      const ratio = snapshot.player.maxHealth <= 0 ? 0 : health / snapshot.player.maxHealth;
      if (this.healthFill) {
        this.healthFill.style.width = `${Math.round(ratio * 100)}%`;
      }
      if (this.healthText) {
        this.healthText.textContent = `${Math.round(health)}`;
      }
    }

    if (snapshot.kills !== this.lastKills) {
      this.lastKills = snapshot.kills;
      if (this.killCount) {
        this.killCount.textContent = String(snapshot.kills);
      }
    }

    const timeKey = formatRunTime(snapshot.elapsedSeconds);
    if (timeKey !== this.lastTimeKey) {
      this.lastTimeKey = timeKey;
      if (this.runTime) {
        this.runTime.textContent = timeKey;
      }
    }

    if (snapshot.status !== this.lastStatus) {
      this.lastStatus = snapshot.status;
      if (this.gameOver) {
        this.gameOver.hidden = snapshot.status !== 'gameOver';
      }
      if (snapshot.status === 'gameOver' && this.gameOverKills) {
        this.gameOverKills.textContent = String(snapshot.kills);
      }
    }
  }

  dispose(): void {
    this.restartButton?.removeEventListener('click', this.handleRestart);
  }

  private readonly handleRestart = (): void => {
    this.onRestart();
  };
}

export function formatRunTime(elapsedSeconds: number): string {
  const total = Math.max(0, Math.floor(elapsedSeconds));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
