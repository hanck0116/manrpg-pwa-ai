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

const withCoin = (state: GameState, coin: number): GameState => ({
  ...state,
  player: {
    ...state.player,
    stats: {
      ...state.player.stats,
      coin
    }
  }
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
    const base = maintenanceState();
    const state = {
      ...base,
      player: {
        ...base.player,
        stats: {
          ...base.player.stats,
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
    const base = maintenanceState();
    const state = {
      ...base,
      player: {
        ...base.player,
        stats: {
          ...base.player.stats,
          wisdom: 0
        }
      },
      inventory: [item]
    };

    const next = useInventoryItem(state, item.id);

    expect(next.inventory).toHaveLength(1);
    expect(next.spells).toHaveLength(0);
  });

  it('adds a Korean source-name item when buying from the shop', () => {
    const next = buyShopItem(withCoin(maintenanceState(), 10), 'magic-basic');

    expect(next.player.stats.coin).toBe(7);
    expect(next.inventory[0]).toMatchObject({
      name: '기초 마법서',
      type: 'magicBook',
      grade: '기초',
      sell: 3
    });
  });

  it('adds a magicTicket, not a magicBook, when buying a draw ticket', () => {
    const next = buyShopItem(withCoin(maintenanceState(), 20), 'magic-draw-ticket');

    expect(next.player.stats.coin).toBe(5);
    expect(next.inventory[0]).toMatchObject({
      name: '기초 마법서 뽑기권',
      type: 'magicTicket',
      grade: '기초',
      mode: 'random',
      sell: 3
    });
  });

  it('does not buy when coin is insufficient', () => {
    const next = buyShopItem(withCoin(maintenanceState(), 2), 'magic-basic');

    expect(next.player.stats.coin).toBe(2);
    expect(next.inventory).toHaveLength(0);
  });

  it('does not buy outside maintenance phases', () => {
    const state = {
      ...withCoin(maintenanceState(), 10),
      phase: 'player-main' as const
    };
    const next = buyShopItem(state, 'magic-basic');

    expect(next.player.stats.coin).toBe(10);
    expect(next.inventory).toHaveLength(0);
  });

  it('uses random magicTicket to add one spell and remove the ticket', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const item = makeItem('기초 마법서 뽑기권');
    const state = {
      ...maintenanceState(),
      inventory: [item]
    };

    const next = useInventoryItem(state, item.id);

    expect(next.spells).toHaveLength(1);
    expect(next.spells[0]).toMatchObject({ name: '라이트', circle: 1, grade: '기초' });
    expect(next.inventory).toHaveLength(0);
    vi.restoreAllMocks();
  });

  it('keeps select magicTicket until selection UI exists', () => {
    const item = makeItem('기초 마법서 선택권');
    const state = {
      ...maintenanceState(),
      inventory: [item]
    };

    const next = useInventoryItem(state, item.id);

    expect(next.spells).toHaveLength(0);
    expect(next.inventory).toHaveLength(1);
  });


  it('uses a trait item to add the trait and remove the item', () => {
    const item = makeItem('모델링');
    const next = useInventoryItem({ ...maintenanceState(), inventory: [item] }, item.id);

    expect(next.player.stats.traits).toContain('모델링');
    expect(next.inventory).toHaveLength(0);
  });

  it('keeps a trait item when the trait is already owned', () => {
    const item = makeItem('모델링');
    const base = maintenanceState();
    const next = useInventoryItem(
      {
        ...base,
        player: { ...base.player, stats: { ...base.player.stats, traits: ['모델링'] } },
        inventory: [item]
      },
      item.id
    );

    expect(next.player.stats.traits).toEqual(['모델링']);
    expect(next.inventory).toHaveLength(1);
  });

  it('blocks restricted trait item use without prerequisite traits', () => {
    const item = makeItem('중급 정령');
    const next = useInventoryItem({ ...maintenanceState(), inventory: [item] }, item.id);

    expect(next.player.stats.traits).not.toContain('중급 정령');
    expect(next.inventory).toHaveLength(1);
  });

  it('keeps choice item until choice UI exists', () => {
    const item = makeItem('아무 선택권');
    const state = {
      ...maintenanceState(),
      inventory: [item]
    };

    const next = useInventoryItem(state, item.id);

    expect(next.inventory).toHaveLength(1);
  });
});

describe('magicBook attempt cost', () => {
  it('uses the first floor attempt for free and keeps the book on failure', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const item = makeItem('기초 마법서');
    const state = {
      ...withCoin(maintenanceState(), 0),
      inventory: [item],
      player: {
        ...maintenanceState().player,
        stats: { ...maintenanceState().player.stats, wisdom: 0, coin: 0 }
      }
    };

    const next = useInventoryItem(state, item.id);

    expect(next.magicBookAttempt).toEqual({ floor: 1, freeUsed: true });
    expect(next.player.stats.coin).toBe(0);
    expect(next.inventory).toHaveLength(1);
    vi.restoreAllMocks();
  });

  it('charges 1 coin from the second attempt on the same floor', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const item = makeItem('기초 마법서');
    const state = {
      ...withCoin(maintenanceState(), 2),
      magicBookAttempt: { floor: 1, freeUsed: true },
      inventory: [item],
      player: {
        ...maintenanceState().player,
        stats: { ...maintenanceState().player.stats, wisdom: 0, coin: 2 }
      }
    };

    const next = useInventoryItem(state, item.id);

    expect(next.player.stats.coin).toBe(1);
    expect(next.inventory).toHaveLength(1);
    vi.restoreAllMocks();
  });

  it('blocks a paid attempt without coins before rolling', () => {
    const item = makeItem('기초 마법서');
    const state = {
      ...withCoin(maintenanceState(), 0),
      magicBookAttempt: { floor: 1, freeUsed: true },
      inventory: [item]
    };

    const next = useInventoryItem(state, item.id);

    expect(next.player.stats.coin).toBe(0);
    expect(next.inventory).toHaveLength(1);
    expect(next.log.at(-1)?.message).toContain('1코인이 필요합니다');
    vi.restoreAllMocks();
  });

  it('removes the magic book on success', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const item = makeItem('기초 마법서');
    const state = {
      ...maintenanceState(),
      inventory: [item],
      player: {
        ...maintenanceState().player,
        stats: { ...maintenanceState().player.stats, wisdom: 99 }
      }
    };

    const next = useInventoryItem(state, item.id);

    expect(next.inventory).toHaveLength(0);
    expect(next.spells).toHaveLength(1);
    vi.restoreAllMocks();
  });
});

describe('saveVersion 15', () => {
  it('round-trips latest reward item types and queued action fields', () => {
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
      label: '테스트 마법 시전',
      spellId: 'spell-1',
      itemId: 'item-1',
      reactionType: 'guard'
    };
    const state = {
      ...maintenanceState(),
      actionQueue: [action],
      inventory: [
        makeItem('기초 마법서 뽑기권'),
        makeItem('아무 선택권'),
        {
          id: 'multi-item-1',
          name: '묶음 보상',
          type: 'multiItem' as const,
          itemName: '외공서',
          count: 2,
          sell: 0
        }
      ],
      pendingReaction: {
        against: 'player' as const,
        attackLog: '공격 대기',
        damage: 1
      }
    };

    expect(saveGameStub(state)).toContain('saveVersion 15');
    expect(loadGameStub().actionQueue[0]).toMatchObject(action);
    expect(loadGameStub().inventory.map((item) => item.type)).toEqual(['magicTicket', 'choice', 'multiItem']);
    expect(loadGameStub().pendingReaction).toMatchObject({ against: 'player', damage: 1 });

    vi.unstubAllGlobals();
  });
});
