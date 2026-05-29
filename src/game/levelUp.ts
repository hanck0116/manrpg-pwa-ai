import { calcDerivedStats } from '../rules/derivedStats';
import { appendLog, type Character, type GameState } from '../state/gameState';

const refreshPlayerAfterLevelUp = (player: Character): Character => {
  const derived = calcDerivedStats(player.stats);

  return {
    ...player,
    derived,
    hp: derived.maxHP,
    mp: derived.maxMP,
    guarding: false
  };
};

export const applyFiveLevelPlus = (state: GameState): GameState => {
  if (state.phase !== 'floor-cleared') {
    return appendLog(state, '층 클리어 상태에서만 5Lv 플러스를 적용할 수 있습니다.');
  }

  if (state.levelUpPending) {
    return appendLog(state, '이미 5Lv 플러스가 적용되었습니다.');
  }

  const leveledPlayer = refreshPlayerAfterLevelUp({
    ...state.player,
    stats: {
      ...state.player.stats,
      level: state.player.stats.level + 5
    }
  });

  return appendLog(
    {
      ...state,
      player: leveledPlayer,
      levelUpPending: true,
      actionQueue: []
    },
    '5Lv 플러스가 적용되었습니다. 레벨이 5 상승하고 스탯 포인트가 증가했습니다.'
  );
};

export const canFinishLevelAllocation = (state: GameState): boolean =>
  state.levelUpPending && state.player.derived.remainingStatPoint === 0;

export const finishLevelAllocation = (state: GameState): GameState => {
  if (!state.levelUpPending) {
    return state;
  }

  if (!canFinishLevelAllocation(state)) {
    return appendLog(state, '레벨업으로 얻은 스탯 포인트를 모두 분배해야 다음 층에 진입할 수 있습니다.');
  }

  return appendLog(
    {
      ...state,
      levelUpPending: false,
      phase: state.rewardState?.claimed ? 'reward-pending' : state.phase,
      actionQueue: []
    },
    '레벨업 스탯 분배가 완료되었습니다.'
  );
};
