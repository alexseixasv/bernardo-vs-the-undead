import type { SfxId } from './AudioSystem';
import type { WorldSnapshot } from '../world/World';

export function detectSfx(previous: WorldSnapshot | null, next: WorldSnapshot): SfxId[] {
  if (previous === null) {
    return [];
  }

  const cues: SfxId[] = [];

  if (startedEffect(previous.pulse?.remaining, next.pulse?.remaining)) {
    cues.push('pulse');
  }
  if (startedEffect(previous.slash?.remaining, next.slash?.remaining)) {
    cues.push('sword');
  }
  if (next.kills > previous.kills) {
    cues.push('hit');
  }
  if (next.player.xp > previous.player.xp || next.player.level > previous.player.level) {
    cues.push('gem');
  }
  if (next.player.health < previous.player.health) {
    cues.push('hurt');
  }
  if (previous.status !== 'levelUp' && next.status === 'levelUp') {
    cues.push('levelUp');
  }
  if (previous.status !== 'gameOver' && next.status === 'gameOver') {
    cues.push('gameOver');
  }

  return cues;
}

function startedEffect(
  previousRemaining: number | undefined,
  nextRemaining: number | undefined,
): boolean {
  if (nextRemaining === undefined) {
    return false;
  }
  if (previousRemaining === undefined) {
    return true;
  }
  return nextRemaining > previousRemaining + 1e-6;
}
