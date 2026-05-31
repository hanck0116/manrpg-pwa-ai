import { describe, expect, it, vi } from 'vitest';
import { makeItem } from '../rules/reward';
import { createInitialGameState, type GameState } from '../state/gameState';
import { clearSavedGame, LEGACY_SAVE_KEYS, SAVE_KEY } from '../storage/save';
import { exportStateJson, fullRecoverPlayer, grantTestCoins, grantTestRewards, setEnemyHpToOne } from './debugTools';

const baseState = (): GameState => ({
  ...createInitialGameState(),
  setupMode: false,
  phase: 'player-main',
  turnOwner: 'player'
});

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

describe('debug tools', () => {
  it('grantTestCoins increases player coin', () => {
    const state = baseState();
    const next = grantTestCoins(state);

    expect(next.player.stats.coin).toBe(state.player.stats.coin + 50);
  });

  it('grantTestRewards adds makeItem-based source items to inventory', () => {
    const next = grantTestRewards(baseState());
    const expectedItems = ['외공서', '내공서', '검기', '기초 마법서', '기초 마법서 뽑기권', '기초 마법서 선택권', '중급 마법서 선택권', '스킬 초기화권'].map((name) =>
      makeItem(name)
    );

    expect(next.inventory.map((item) => item.name)).toEqual(expectedItems.map((item) => item.name));
    expect(next.inventory.map((item) => item.type)).toEqual(expectedItems.map((item) => item.type));
  });

  it('setEnemyHpToOne sets enemy hp to 1', () => {
    expect(setEnemyHpToOne(baseState()).enemy.hp).toBe(1);
  });

  it('fullRecoverPlayer restores player hp and mp to max', () => {
    const state = {
      ...baseState(),
      player: {
        ...baseState().player,
        hp: 1,
        mp: 0
      }
    };
    const next = fullRecoverPlayer(state);

    expect(next.player.hp).toBe(next.player.derived.maxHP);
    expect(next.player.mp).toBe(next.player.derived.maxMP);
  });

  it('exportStateJson includes player and enemy state', () => {
    const json = exportStateJson(baseState());
    const parsed = JSON.parse(json) as GameState;

    expect(parsed.player.kind).toBe('player');
    expect(parsed.enemy.kind).toBe('enemy');
  });

  it('exportStateJson does not include API key-like fields', () => {
    const stateWithInjectedKey = {
      ...baseState(),
      groqKey: 'secret-api-key',
      apiKey: 'secret-api-key'
    };

    expect(exportStateJson(stateWithInjectedKey)).not.toContain('secret-api-key');
  });
});

describe('clearSavedGame', () => {
  it('removes current and legacy save keys without touching AI settings', () => {
    const localStorageStub = createLocalStorage();
    vi.stubGlobal('localStorage', localStorageStub);

    const message = clearSavedGame();

    expect(message).toBe('저장 데이터를 초기화했습니다.');
    expect(localStorageStub.removeItem).toHaveBeenCalledWith(SAVE_KEY);
    LEGACY_SAVE_KEYS.forEach((key) => expect(localStorageStub.removeItem).toHaveBeenCalledWith(key));
    expect(localStorageStub.removeItem).not.toHaveBeenCalledWith('manrpg-pwa-ai:ai-settings:v1');

    vi.unstubAllGlobals();
  });
});
