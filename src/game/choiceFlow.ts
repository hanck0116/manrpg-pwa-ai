import { appendLog, type GameState, type LearnedSpell, type PendingChoiceOption } from '../state/gameState';
import { applyChoiceItemResult } from './rewardApply';

const maintenancePhases: GameState['phase'][] = ['reward-pending', 'level-up-pending', 'floor-cleared', 'battle-ended'];

const createId = (prefix: string): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? `${prefix}-${crypto.randomUUID()}` : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const isMaintenancePhase = (state: GameState): boolean => maintenancePhases.includes(state.phase);

const findOption = (state: GameState, optionId: string): PendingChoiceOption | undefined =>
  state.pendingChoice?.options.find((option) => option.id === optionId);

export const cancelPendingChoice = (state: GameState): GameState => {
  if (!isMaintenancePhase(state)) {
    return appendLog(state, '선택권은 정비 단계에서만 취소할 수 있습니다.');
  }

  if (!state.pendingChoice) {
    return appendLog(state, '취소할 선택이 없습니다.');
  }

  return appendLog(
    {
      ...state,
      pendingChoice: undefined
    },
    '선택을 취소했습니다.'
  );
};

export const confirmPendingChoice = (state: GameState, optionId: string): GameState => {
  if (!isMaintenancePhase(state)) {
    return appendLog(state, '선택권은 정비 단계에서만 확정할 수 있습니다.');
  }

  if (!state.pendingChoice) {
    return appendLog(state, '확정할 선택이 없습니다.');
  }

  const option = findOption(state, optionId);

  if (!option) {
    return appendLog(state, '선택지를 찾을 수 없습니다.');
  }

  if (state.pendingChoice.kind === 'magicTicketSelect') {
    const circle = Number(option.meta?.circle ?? 1);
    const grade = String(option.meta?.grade ?? '기초');
    const learnedSpell: LearnedSpell = {
      id: createId('spell'),
      name: option.value,
      circle,
      grade,
      sourceItemName: state.pendingChoice.sourceItemName
    };

    return appendLog(
      {
        ...state,
        spells: [...state.spells, learnedSpell],
        inventory: state.inventory.filter((item) => item.id !== state.pendingChoice?.sourceItemId),
        pendingChoice: undefined
      },
      `${state.pendingChoice.sourceItemName} 사용: ${option.value} ${circle}서클 마법을 선택 획득했습니다.`
    );
  }

  return applyChoiceItemResult(
    {
      ...state,
      pendingChoice: undefined
    },
    state.pendingChoice.sourceItemId,
    state.pendingChoice.sourceItemName,
    option.value
  );
};
