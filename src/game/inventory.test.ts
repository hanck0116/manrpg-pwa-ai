import { describe, expect, it, vi } from 'vitest';
import { useInventoryItem } from './inventory';
import { buyShopItem } from '../rules/shop';
import { makeItem } from '../rules/reward';
import { createInitialGameState, type GameState, type QueuedAction } from '../state/gameState';
import { loadGameStub, saveGameStub } from '../storage/save';

const maintenanceState = (): GameState => ({
  ...createInitialGameState(),
  setupMode: false,
  phase: 'floor-cleared',
  turnOwner: 'player'
});

describe('inventory and shop', () => {
  it('increases outerStack when using an outer manual', () => {
    const item = makeItem('외공서');
    const state = {
      ...maintenanceState(),
      inventory: [item]
    };

    const next = useInventoryItem(state, item.id);

    expect(next.player.stats.outerStack).toBe(state.player.stats.outerStack + 1);
    expect(next.inventory).toHaveLength(0);
  });

  it('caps swordKi at 6 when using sword manuals', () => {
    const item = makeItem('검기');
    const state = {
      ...maintenanceState(),
      player: {
        ...maintenanceState().player,
        stats: {
          ...maintenanceState().player.stats,
          swordKi: 6 as const
        }
      },
      inventory: [item]
    };

    const next = useInventoryItem(state, item.id);

    expect(next.player.stats.swordKi).toBe(6);
    expect(next.inventory).toHaveLength(1);
  });

  it('keeps a magic book in inventory when learning fails', () => {
    const item = makeItem('기초 마법서');
    const state = {
      ...maintenanceState(),
      player: {
        ...maintenanceState().player,
        stats: {
          ...maintenanceState().player.stats,
          wisdom: 0
        }
      },
      inventory: [item]
    };

    const next = useInventoryItem(state, item.id);

    expect(next.inventory).toHaveLength(1);
    expect(next.spells).toHaveLength(0);
  });

  it('spends coin and adds inventory when buying from the shop', () => {
    const state = {
      ...maintenanceState(),
      player: {
        ...maintenanceState().player,
        stats: {
          ...maintenanceState().player.stats,
          coin: 10
        }
      }
    };

    const next = buyShopItem(state, 'magic-basic');

    expect(next.player.stats.coin).toBe(7);
    expect(next.inventory).toHaveLength(1);
  });
});

describe('saveVersion 8', () => {
  it('round-trips the latest queued action fields', () => {
    const storage = new Map<string, string>();
    const localStorageStub = {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage.set(key, value);
      })
    };
    vi.stubGlobal('localStorage', localStorageStub);

    const action: QueuedAction = {
      id: 'action-1',
      type: 'spell',
      label: 'Test spell cast',
      spellId: 'spell-1',
      itemId: 'item-1',
      reactionType: 'guard'
    };
    const state = {
      ...maintenanceState(),
      actionQueue: [action],
      pendingReaction: {
        against: 'player' as const,
        attackLog: 'incoming',
        damage: 1
      }
    };

    expect(saveGameStub(state)).toContain('saveVersion 8');
    expect(loadGameStub().actionQueue[0]).toMatchObject(action);
    expect(loadGameStub().pendingReaction).toMatchObject({ against: 'player', damage: 1 });

    vi.unstubAllGlobals();
  });
});
