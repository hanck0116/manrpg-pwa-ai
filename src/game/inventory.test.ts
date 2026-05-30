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

describe('인벤토리와 상점', () => {
  it('외공서 사용 시 outerStack이 1 증가합니다', () => {
    const item = makeItem('외공서');
    const state = {
      ...maintenanceState(),
      inventory: [item]
    };

    const next = useInventoryItem(state, item.id);

    expect(next.player.stats.outerStack).toBe(state.player.stats.outerStack + 1);
    expect(next.inventory).toHaveLength(0);
  });

  it('검기 사용 시 swordKi는 최대 6을 넘지 않습니다', () => {
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

  it('마법서 습득 실패 시 인벤토리를 유지합니다', () => {
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

  it('상점 구매 시 한국어 원본명 아이템을 인벤토리에 추가합니다', () => {
    const next = buyShopItem(withCoin(maintenanceState(), 10), 'magic-basic');

    expect(next.player.stats.coin).toBe(7);
    expect(next.inventory[0]).toMatchObject({
      name: '기초 마법서',
      type: 'magicBook',
      grade: '기초',
      sell: 3
    });
  });

  it('마법서 뽑기권은 바로 학습 가능한 마법서로 만들지 않습니다', () => {
    const next = buyShopItem(withCoin(maintenanceState(), 20), 'magic-draw-ticket');

    expect(next.player.stats.coin).toBe(5);
    expect(next.inventory[0]).toMatchObject({
      name: '마법서 뽑기권',
      type: 'item',
      sell: 0
    });
  });

  it('코인이 부족하면 구매할 수 없습니다', () => {
    const next = buyShopItem(withCoin(maintenanceState(), 2), 'magic-basic');

    expect(next.player.stats.coin).toBe(2);
    expect(next.inventory).toHaveLength(0);
  });

  it('정비 단계가 아니면 구매할 수 없습니다', () => {
    const state = {
      ...withCoin(maintenanceState(), 10),
      phase: 'player-main' as const
    };
    const next = buyShopItem(state, 'magic-basic');

    expect(next.player.stats.coin).toBe(10);
    expect(next.inventory).toHaveLength(0);
  });
});

describe('saveVersion 8', () => {
  it('최신 행동 큐 필드를 저장하고 복구합니다', () => {
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
      pendingReaction: {
        against: 'player' as const,
        attackLog: '공격 대기',
        damage: 1
      }
    };

    expect(saveGameStub(state)).toContain('saveVersion 8');
    expect(loadGameStub().actionQueue[0]).toMatchObject(action);
    expect(loadGameStub().pendingReaction).toMatchObject({ against: 'player', damage: 1 });

    vi.unstubAllGlobals();
  });
});
