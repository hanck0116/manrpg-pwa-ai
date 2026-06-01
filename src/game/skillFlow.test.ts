import { describe, expect, it, vi } from 'vitest';
import { enqueueAction } from './actionQueue';
import { createPlayerSkill } from '../rules/skill';
import { makeItem } from '../rules/reward';
import { createInitialGameState, type GameState, type QueuedAction } from '../state/gameState';
import { useInventoryItem } from './inventory';
import { loadGameStub, saveGameStub } from '../storage/save';
import { finishPlayerMainTurn } from './turn';

const battleState = (): GameState => {
  const skill = createPlayerSkill({ name: '외공 공격', resourceType: 'outer', effectType: 'damage', multiplier: 100 });
  return {
    ...createInitialGameState(),
    setupMode: false,
    phase: 'player-main',
    turnOwner: 'player',
    skills: [skill]
  };
};

const maintenanceState = (): GameState => ({
  ...createInitialGameState(),
  setupMode: false,
  phase: 'floor-cleared',
  turnOwner: 'player',
  skills: [createPlayerSkill({ name: '외공 공격', resourceType: 'outer', effectType: 'damage', multiplier: 1 })]
});

describe('skill flow', () => {
  it('queues a skill action with skillId', () => {
    const state = battleState();
    const action: QueuedAction = { id: 'skill-action', type: 'skill', skillId: state.skills[0].id, label: '외공 공격 사용' };
    const next = enqueueAction(state, action);

    expect(next.actionQueue[0].skillId).toBe(state.skills[0].id);
  });

  it('skill defeat changes phase to floor-cleared', () => {
    const state = battleState();
    const action: QueuedAction = { id: 'skill-action', type: 'skill', skillId: state.skills[0].id, label: '외공 공격 사용' };
    const queued = enqueueAction(state, action);
    const next = finishPlayerMainTurn(queued);

    expect(next.phase).toBe('floor-cleared');
  });

  it('skill reset ticket clears skills and removes the item', () => {
    const item = makeItem('스킬 초기화권');
    const state = { ...maintenanceState(), inventory: [item] };
    const next = useInventoryItem(state, item.id);

    expect(next.skills).toHaveLength(0);
    expect(next.inventory).toHaveLength(0);
  });

  it('saveVersion 14 validates skills', () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage.set(key, value);
      }),
      removeItem: vi.fn((key: string) => {
        storage.delete(key);
      })
    });

    expect(saveGameStub(maintenanceState())).toContain('saveVersion 14');
    expect(loadGameStub().skills).toHaveLength(1);

    vi.unstubAllGlobals();
  });
});
