import { generateRewardOffer } from '../rules/reward';
import { appendLog, type GameState } from '../state/gameState';

export const createRewardOffer = (state: GameState): GameState => {
  if (state.phase !== 'floor-cleared' && state.phase !== 'reward-pending') {
    return appendLog(state, '층 클리어 이후에만 보상 후보를 생성할 수 있습니다.');
  }

  if (state.rewardState?.claimed) {
    return appendLog(state, '이미 보상을 획득했습니다. 다음 층에 진입할 수 있습니다.');
  }

  return appendLog(
    {
      ...state,
      phase: 'reward-pending',
      rewardState: generateRewardOffer(state.player.stats.appearance),
      actionQueue: []
    },
    '보상 후보가 생성되었습니다.'
  );
};

export const toggleRewardSelection = (state: GameState, rewardId: string): GameState => {
  if (state.phase !== 'reward-pending') {
    return appendLog(state, '보상 선택 단계가 아닙니다.');
  }

  if (!state.rewardState) {
    return appendLog(state, '보상 후보가 없습니다.');
  }

  if (state.rewardState.claimed) {
    return appendLog(state, '이미 보상을 획득했습니다.');
  }

  const alreadySelected = state.rewardState.selectedIds.includes(rewardId);

  if (!alreadySelected && state.rewardState.selectedIds.length >= state.rewardState.pickCount) {
    return appendLog(state, `최대 ${state.rewardState.pickCount}개까지만 선택할 수 있습니다.`);
  }

  return {
    ...state,
    rewardState: {
      ...state.rewardState,
      selectedIds: alreadySelected
        ? state.rewardState.selectedIds.filter((selectedId) => selectedId !== rewardId)
        : [...state.rewardState.selectedIds, rewardId]
    }
  };
};

export const claimSelectedRewards = (state: GameState): GameState => {
  if (state.phase !== 'reward-pending') {
    return appendLog(state, '보상 선택 단계가 아닙니다.');
  }

  if (!state.rewardState) {
    return appendLog(state, '보상 후보가 없습니다.');
  }

  if (state.rewardState.claimed) {
    return appendLog(state, '이미 보상을 획득했습니다. 다음 층에 진입할 수 있습니다.');
  }

  if (state.rewardState.selectedIds.length !== state.rewardState.pickCount) {
    return appendLog(state, '선택 가능한 보상을 모두 선택해야 합니다.');
  }

  const selectedRewards = state.rewardState.offered.filter((reward) => state.rewardState?.selectedIds.includes(reward.id));
  const gainedCoin = selectedRewards.reduce((sum, reward) => sum + (reward.type === 'coin' ? reward.coin ?? 0 : 0), 0);
  const inventoryRewards = selectedRewards.filter((reward) => reward.type !== 'coin');

  return appendLog(
    {
      ...state,
      player: {
        ...state.player,
        stats: {
          ...state.player.stats,
          coin: state.player.stats.coin + gainedCoin
        }
      },
      inventory: [...state.inventory, ...inventoryRewards],
      rewardState: {
        ...state.rewardState,
        claimed: true
      }
    },
    '보상을 획득했습니다. 다음 층에 진입할 수 있습니다.'
  );
};
