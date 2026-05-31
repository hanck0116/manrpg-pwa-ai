import { makeItem } from '../rules/reward';
import { SPELLS } from '../rules/spell';
import { clearSavedGame } from '../storage/save';
import { appendLog, createInitialGameState, type GameState, type LearnedSpell } from '../state/gameState';
import { refreshPlayer } from './characterUpdate';

const debugLog = (state: GameState, message: string): GameState => appendLog(state, `실험/디버그: ${message}`);

export const resetAllProgress = (_state: GameState): GameState =>
  debugLog(createInitialGameState(), '원본 규칙 진행이 아니라 테스트 편의를 위해 새 캐릭터 초기 상태로 되돌렸습니다.');

export const clearSavedData = (): void => {
  clearSavedGame();
};

export const grantTestCoins = (state: GameState, amount = 50): GameState =>
  debugLog(
    refreshPlayer({
      ...state,
      player: {
        ...state.player,
        stats: {
          ...state.player.stats,
          coin: state.player.stats.coin + amount
        }
      }
    }),
    `원본 규칙 보상이 아니라 테스트 편의로 코인 ${amount}개를 지급했습니다.`
  );

export const grantTestRewards = (state: GameState): GameState => {
  const items = ['외공서', '내공서', '검기', '기초 마법서', '기초 마법서 뽑기권', '스킬 초기화권'].map((name) => makeItem(name));

  return debugLog(
    {
      ...state,
      inventory: [...state.inventory, ...items]
    },
    '원본 규칙 보상이 아니라 테스트 편의로 외공서, 내공서, 검기, 기초 마법서, 기초 마법서 뽑기권, 스킬 초기화권을 지급했습니다.'
  );
};

export const grantTestSpell = (state: GameState): GameState => {
  const spellName = SPELLS[2].includes('파이어 애로우') ? '파이어 애로우' : SPELLS[2][0];
  const spell: LearnedSpell = {
    id: `debug-spell-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: spellName,
    circle: 2,
    grade: '기초',
    sourceItemName: '실험/디버그'
  };

  return debugLog(
    {
      ...state,
      spells: [...state.spells, spell]
    },
    `${spell.name} ${spell.circle}서클을 테스트 편의로 지급했습니다. 원본 SPELLS 목록에 있는 마법만 사용합니다.`
  );
};

export const setEnemyHpToOne = (state: GameState): GameState =>
  debugLog(
    {
      ...state,
      enemy: {
        ...state.enemy,
        hp: 1
      }
    },
    '원본 전투 피해가 아니라 테스트 편의로 적 HP를 1로 만들었습니다.'
  );

export const fullRecoverPlayer = (state: GameState): GameState =>
  debugLog(
    {
      ...state,
      player: {
        ...state.player,
        hp: state.player.derived.maxHP,
        mp: state.player.derived.maxMP,
        guarding: false
      }
    },
    '원본 회복 규칙이 아니라 테스트 편의로 플레이어 HP/MP를 최대치로 회복했습니다.'
  );

export const exportStateJson = (state: GameState): string =>
  JSON.stringify(
    state,
    (key, value) => (key.toLowerCase().includes('key') || key.toLowerCase().includes('api') ? undefined : value),
    2
  );
