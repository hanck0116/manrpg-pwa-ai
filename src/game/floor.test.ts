import { describe, expect, it } from 'vitest';
import { enterNextFloor } from './floor';
import { createCharacter, createInitialGameState, type GameState } from '../state/gameState';

const readyForNextFloor = (): GameState => {
  const base = createInitialGameState();
  return {
    ...base,
    setupMode: false,
    phase: 'reward-pending',
    rewardState: { offered: [], selectedIds: [], offerCount: 0, pickCount: 0, claimed: true },
    player: createCharacter({
      ...base.player,
      stats: { ...base.player.stats, strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, appearance: 10 }
    }),
    magicBookAttempt: { floor: 1, freeUsed: true }
  };
};

describe('enterNextFloor', () => {
  it('resets fixed positions and magicBook free attempt', () => {
    const next = enterNextFloor(readyForNextFloor());

    expect(next.player.position).toEqual({ x: 5, y: 9 });
    expect(next.enemy.position).toEqual({ x: 5, y: 1 });
    expect(next.magicBookAttempt).toEqual({ floor: 2, freeUsed: false });
  });
});
