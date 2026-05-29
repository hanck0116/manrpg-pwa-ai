import { moveCharacterSteps } from './movement';
import { resolveBasicAttack } from '../rules/combat';
import { appendLog, type GameState, type QueuedAction } from '../state/gameState';

export const enqueueAction = (state: GameState, action: QueuedAction): GameState => {
  if (state.phase !== 'player-main') {
    return appendLog(state, '플레이어 메인턴에서만 행동을 추가할 수 있습니다. 반응턴은 다음 단계에서 구현합니다.');
  }

  return appendLog(
    {
      ...state,
      actionQueue: [...state.actionQueue, action],
      selectedAction: action.label
    },
    `행동 큐에 추가: ${action.label}`
  );
};

export const removeQueuedAction = (state: GameState, actionId: string): GameState => ({
  ...state,
  actionQueue: state.actionQueue.filter((action) => action.id !== actionId)
});

export const clearActionQueue = (state: GameState): GameState => ({
  ...state,
  actionQueue: []
});

const executeQueuedAction = (state: GameState, action: QueuedAction): GameState => {
  if (state.phase === 'battle-ended' || state.player.hp <= 0 || state.enemy.hp <= 0) {
    return state;
  }

  const baseState = {
    ...state,
    player: { ...state.player, guarding: false },
    enemy: { ...state.enemy, guarding: false },
    selectedAction: action.label
  };

  switch (action.type) {
    case 'move':
      return moveCharacterSteps(baseState, baseState.player.id, action.direction ?? 'up', action.steps ?? 1);
    case 'basic-attack': {
      const result = resolveBasicAttack(baseState.player, baseState.enemy);

      return appendLog(
        {
          ...baseState,
          enemy: { ...baseState.enemy, hp: result.targetHp }
        },
        result.log
      );
    }
    case 'defend':
      return appendLog(
        {
          ...baseState,
          player: { ...baseState.player, guarding: true }
        },
        '플레이어가 방어 자세를 취했습니다.'
      );
    case 'skill':
      return appendLog(baseState, '스킬은 원본 규칙 확인 후 구현 예정입니다.');
    case 'spell':
      return appendLog(baseState, '마법은 원본 규칙 확인 후 구현 예정입니다.');
    case 'item':
      return appendLog(baseState, '아이템은 저장/인벤토리 규칙 확인 후 구현 예정입니다.');
    case 'wait':
      return appendLog(baseState, '플레이어가 대기했습니다.');
  }
};

export const executeActionQueue = (state: GameState): GameState => {
  const queuedActions = state.actionQueue;
  const executedState = queuedActions.reduce<GameState>(executeQueuedAction, state);

  return clearActionQueue(executedState);
};
