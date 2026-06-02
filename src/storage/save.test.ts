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

describe('saveVersion 19', () => {
  it('stores saveVersion 19', () => {
    vi.stubGlobal('localStorage', createLocalStorage());

    expect(saveGameStub(createInitialGameState())).toContain('saveVersion 19');

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

  it('keeps techniqueSources, techniques, and extended skill fields', () => {
    vi.stubGlobal('localStorage', createLocalStorage());
    const state = {
      ...createInitialGameState(),
      techniqueSources: ['공법'],
      techniques: [
        {
          id: 'tech-1',
          name: '격',
          source: '공법',
          kind: 'attack' as const,
          mpDelta: -1,
          hpDelta: 0,
          damageMultiplier: 1.5,
          judgeStat: 'strength' as const,
          judgeBonus: 1
        }
      ],
      skills: [
        {
          id: 'skill-2',
          name: '확장',
          resourceType: 'outer' as const,
          timing: 'main' as const,
          multiplier: 1,
          target: 'enemy' as const,
          effectType: 'damage' as const,
          mpDelta: -1,
          hpDelta: 0,
          damageMultiplier: 2,
          judgeStat: 'strength' as const,
          judgeBonus: 1,
          kind: 'attack' as const
        }
      ]
    };

    saveGameStub(state);
    const loaded = loadGameStub();

    expect(loaded.techniqueSources).toEqual(['공법']);
    expect(loaded.techniques[0].name).toBe('격');
    expect(loaded.skills[0].damageMultiplier).toBe(2);

    vi.unstubAllGlobals();
  });

  it('keeps halo and status state after save/load', () => {
    vi.stubGlobal('localStorage', createLocalStorage());
    const state = {
      ...createInitialGameState(),
      statuses: [{ id: 'status-1', name: '욕망의 대가', target: 'player' as const, durationTurns: 2, kind: 'control' as const, note: '결과' }],
      halo: {
        selectedKind: 'desire' as const,
        usedThisFloor: { amplification: true },
        pendingAmplification: { description: '다음 행동', createdTurn: 3, consumeOnNextNarration: true },
        pendingDesire: { result: '결과', actionDisabledTurns: 2 },
        observedSpells: [{ id: 'spell-1', name: '관측', circle: 1, grade: '기초' }],
        history: ['헤일로 기록']
      }
    };

    saveGameStub(state);
    const loaded = loadGameStub();

    expect(loaded.halo.selectedKind).toBe('desire');
    expect(loaded.halo.observedSpells[0].name).toBe('관측');
    expect(loaded.statuses[0].name).toBe('욕망의 대가');

    vi.unstubAllGlobals();
  });
});
