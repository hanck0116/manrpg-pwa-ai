import { describe, expect, it, beforeEach } from 'vitest';
import { createInitialGameState } from '../state/gameState';
import { loadGameStub, saveGameStub, SAVE_KEY, SAVE_VERSION } from './save';

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  globalThis.localStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
    key: (index: number) => Array.from(storage.keys())[index] ?? null,
    get length() {
      return storage.size;
    }
  } as Storage;
});

describe('saveVersion 19 GM fields', () => {
  it('round-trips sceneSummary, recentEvents, nextChoices, and hiddenEnemyHint', () => {
    const state = {
      ...createInitialGameState(),
      sceneSummary: '요약 유지',
      recentEvents: ['최근1', '최근2'],
      nextChoices: ['선택1', '선택2', '선택3'],
      hiddenEnemyHint: { distanceHint: '거리', threatHint: '위협', conditionHint: '상태' },
      gmTurnCount: 7
    };

    expect(saveGameStub(state)).toContain(`saveVersion ${SAVE_VERSION}`);
    expect(storage.has(SAVE_KEY)).toBe(true);

    const loaded = loadGameStub();
    expect(loaded.sceneSummary).toBe('요약 유지');
    expect(loaded.recentEvents).toEqual(['최근1', '최근2']);
    expect(loaded.nextChoices).toEqual(['선택1', '선택2', '선택3']);
    expect(loaded.hiddenEnemyHint).toEqual({ distanceHint: '거리', threatHint: '위협', conditionHint: '상태' });
    expect(loaded.gmTurnCount).toBe(7);
  });
});
