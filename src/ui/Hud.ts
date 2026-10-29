import type { UpgradeOffer } from '../systems/AbilitySystem';
import type { WorldSnapshot } from '../world/World';

export interface HudCallbacks {
  onRestart: () => void;
  onSelectUpgrade: (index: number) => void;
}

export class Hud {
  private readonly healthFill: HTMLElement | null;
  private readonly healthText: HTMLElement | null;
  private readonly xpFill: HTMLElement | null;
  private readonly xpText: HTMLElement | null;
  private readonly playerLevel: HTMLElement | null;
  private readonly killCount: HTMLElement | null;
  private readonly runTime: HTMLElement | null;
  private readonly gameOver: HTMLElement | null;
  private readonly gameOverKills: HTMLElement | null;
  private readonly restartButton: HTMLButtonElement | null;
  private readonly levelUp: HTMLElement | null;
  private readonly levelUpTitle: HTMLElement | null;
  private readonly upgradeCards: HTMLElement | null;
  private readonly callbacks: HudCallbacks;

  private lastHealth = Number.NaN;
  private lastMaxHealth = Number.NaN;
  private lastXp = Number.NaN;
  private lastXpToNext = Number.NaN;
  private lastLevel = Number.NaN;
  private lastKills = Number.NaN;
  private lastTimeKey = '';
  private lastStatus: WorldSnapshot['status'] | null = null;
  private lastOfferKey = '';
  private selectionOpen = false;

  constructor(callbacks: HudCallbacks) {
    this.callbacks = callbacks;
    this.healthFill = document.getElementById('health-fill');
    this.healthText = document.getElementById('health-text');
    this.xpFill = document.getElementById('xp-fill');
    this.xpText = document.getElementById('xp-text');
    this.playerLevel = document.getElementById('player-level');
    this.killCount = document.getElementById('kill-count');
    this.runTime = document.getElementById('run-time');
    this.gameOver = document.getElementById('game-over');
    this.gameOverKills = document.getElementById('game-over-kills');
    this.levelUp = document.getElementById('level-up');
    this.levelUpTitle = document.getElementById('level-up-title');
    this.upgradeCards = document.getElementById('upgrade-cards');
    const button = document.getElementById('restart-button');
    this.restartButton = button instanceof HTMLButtonElement ? button : null;
    this.restartButton?.addEventListener('click', this.handleRestart);
    window.addEventListener('keydown', this.handleKeyDown);
  }

  sync(snapshot: WorldSnapshot): void {
    const health = Math.max(0, snapshot.player.health);
    const maxHealth = Math.max(0, snapshot.player.maxHealth);
    if (health !== this.lastHealth || maxHealth !== this.lastMaxHealth) {
      this.lastHealth = health;
      this.lastMaxHealth = maxHealth;
      const ratio = maxHealth <= 0 ? 0 : health / maxHealth;
      if (this.healthFill) {
        this.healthFill.style.width = `${Math.round(ratio * 100)}%`;
      }
      if (this.healthText) {
        this.healthText.textContent = `${Math.round(health)}/${Math.round(maxHealth)}`;
      }
    }

    if (snapshot.player.level !== this.lastLevel) {
      this.lastLevel = snapshot.player.level;
      if (this.playerLevel) {
        this.playerLevel.textContent = String(snapshot.player.level);
      }
      if (this.levelUpTitle) {
        this.levelUpTitle.textContent = `Level ${snapshot.player.level}`;
      }
    }

    if (snapshot.player.xp !== this.lastXp || snapshot.player.xpToNext !== this.lastXpToNext) {
      this.lastXp = snapshot.player.xp;
      this.lastXpToNext = snapshot.player.xpToNext;
      const ratio =
        snapshot.player.xpToNext <= 0 ? 0 : snapshot.player.xp / snapshot.player.xpToNext;
      if (this.xpFill) {
        this.xpFill.style.width = `${Math.round(Math.min(1, ratio) * 100)}%`;
      }
      if (this.xpText) {
        this.xpText.textContent = `${snapshot.player.xp}/${snapshot.player.xpToNext}`;
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

    const offerKey = `${snapshot.player.pendingLevelUps}:${snapshot.offers.map((offer) => offer.id).join('|')}`;
    if (snapshot.status !== this.lastStatus || offerKey !== this.lastOfferKey) {
      this.lastStatus = snapshot.status;
      this.lastOfferKey = offerKey;
      if (this.gameOver) {
        this.gameOver.hidden = snapshot.status !== 'gameOver';
      }
      if (snapshot.status === 'gameOver' && this.gameOverKills) {
        this.gameOverKills.textContent = String(snapshot.kills);
      }
      if (this.levelUp) {
        this.levelUp.hidden = snapshot.status !== 'levelUp';
      }
      if (snapshot.status === 'levelUp') {
        this.renderOffers(snapshot.offers);
        this.selectionOpen = snapshot.offers.length > 0;
      } else {
        this.selectionOpen = false;
        this.upgradeCards?.replaceChildren();
      }
    }
  }

  dispose(): void {
    this.restartButton?.removeEventListener('click', this.handleRestart);
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  private renderOffers(offers: readonly UpgradeOffer[]): void {
    if (!this.upgradeCards) {
      return;
    }

    this.upgradeCards.replaceChildren();
    offers.forEach((offer, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `upgrade-card upgrade-card--${offer.id}`;
      button.style.setProperty('--accent', offer.accent);
      button.setAttribute('data-index', String(index));

      const kicker = document.createElement('span');
      kicker.className = 'upgrade-kicker';
      kicker.textContent = `${index + 1}`;

      const name = document.createElement('strong');
      name.className = 'upgrade-name';
      name.textContent = offer.name;

      const level = document.createElement('span');
      level.className = 'upgrade-level';
      level.textContent =
        offer.currentLevel === 0 ? 'Unlock' : `Lv ${offer.currentLevel} → ${offer.nextLevel}`;

      const description = document.createElement('p');
      description.className = 'upgrade-description';
      description.textContent = offer.description;

      const result = document.createElement('p');
      result.className = 'upgrade-result';
      result.textContent = offer.result;

      button.append(kicker, name, level, description, result);
      button.addEventListener('click', () => {
        this.handleChoose(index);
      });
      this.upgradeCards?.append(button);
    });
  }

  private handleChoose(index: number): void {
    if (!this.selectionOpen) {
      return;
    }

    this.selectionOpen = false;
    this.setOfferButtonsDisabled(true);
    this.callbacks.onSelectUpgrade(index);
  }

  private setOfferButtonsDisabled(disabled: boolean): void {
    if (!this.upgradeCards) {
      return;
    }

    for (const node of this.upgradeCards.querySelectorAll('button')) {
      node.disabled = disabled;
    }
  }

  private readonly handleRestart = (): void => {
    this.callbacks.onRestart();
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.selectionOpen || this.lastStatus !== 'levelUp') {
      return;
    }

    const index = upgradeIndexFromCode(event.code);
    if (index === null) {
      return;
    }

    event.preventDefault();
    this.handleChoose(index);
  };
}

export function formatRunTime(elapsedSeconds: number): string {
  const total = Math.max(0, Math.floor(elapsedSeconds));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function upgradeIndexFromCode(code: string): number | null {
  if (code === 'Digit1' || code === 'Numpad1') {
    return 0;
  }
  if (code === 'Digit2' || code === 'Numpad2') {
    return 1;
  }
  if (code === 'Digit3' || code === 'Numpad3') {
    return 2;
  }
  return null;
}
