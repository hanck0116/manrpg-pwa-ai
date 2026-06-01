import { describe, expect, it, vi } from 'vitest';
import { makeItem } from '../rules/reward';
import { createInitialGameState } from '../state/gameState';
import { loadGameStub, saveGameStub } from './save';

const createLocalStorage = () => {
  const store = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    })
  };
};

describe('saveVersion 14', () => {
  it('stores saveVersion 14', () => {
    vi.stubGlobal('localStorage', createLocalStorage());

    expect(saveGameStub(createInitialGameState())).toContain('saveVersion 14');

    vi.unstubAllGlobals();
  });

  it('keeps angelTrial state after save/load', () => {
    vi.stubGlobal('localStorage', createLocalStorage());
    const state = {
      ...createInitialGameState(),
      angelTrial: {
        claimedScores: [10, 20],
        lastScore: 20,
        lastResult: '테스트 결과'
      }
    };

    saveGameStub(state);

    expect(loadGameStub().angelTrial).toEqual(state.angelTrial);

    vi.unstubAllGlobals();
  });

  it('keeps magicBookAttempt, equipment-shaped inventory, and skills validation', () => {
    vi.stubGlobal('localStorage', createLocalStorage());
    const state = {
      ...createInitialGameState(),
      magicBookAttempt: { floor: 3, freeUsed: true },
      inventory: [makeItem('기초 마법서 선택권')],
      skills: [
        {
          id: 'skill-1',
          name: '테스트 스킬',
          resourceType: 'outer' as const,
          timing: 'main' as const,
          multiplier: 1,
          target: 'enemy' as const,
          effectType: 'damage' as const
        }
      ]
    };

    saveGameStub(state);

    const loaded = loadGameStub();
    expect(loaded.magicBookAttempt).toEqual({ floor: 3, freeUsed: true });
    expect(loaded.inventory[0].type).toBe('magicTicket');
    expect(loaded.skills[0].name).toBe('테스트 스킬');

    vi.unstubAllGlobals();
  });
});
