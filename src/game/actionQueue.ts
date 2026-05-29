import { moveCharacterSteps } from './movement';
import { resolveBasicAttack } from '../rules/combat';
import { appendLog, type GameState, type QueuedAction } from '../state/gameState';

const isActionBlockedPhase = (state: GameState): boolean =>
  state.phase === 'battle-ended' ||
  state.phase === 'floor-cleared' ||
  state.phase === 'reward-pending' ||
  state.phase === 'level-up-pending' ||
  state.player.hp <= 0 ||
  state.enemy.hp <= 0;

const withBattleEndedIfNeeded = (state: GameState): GameState => {
  if (state.phase === 'battle-ended' || state.phase === 'floor-cleared' || state.phase === 'reward-pending' || state.phase === 'level-up-pending') {
    return state;
  }

  if (state.enemy.hp <= 0) {
    return appendLog(
      {
        ...state,
        phase: 'floor-cleared',
        battleResult: 'win',
        turnOwner: 'player',
        actionQueue: []
      },
      '층 클리어: 적이 쓰러졌습니다. 정비 단계로 이동할 수 있습니다.'
    );
  }

  if (state.player.hp <= 0) {
    return appendLog(
      {
        ...state,
        phase: 'battle-ended',
        battleResult: 'lose',
        turnOwner: 'enemy',
        actionQueue: []
      },
      '전투 종료: 플레이어 HP가 0이 되어 남은 행동 큐를 실행하지 않습니다.'
    );
  }

  return state;
};

export const enqueueAction = (state: GameState, action: QueuedAction): GameState => {
  if (state.setupMode) {
    return appendLog(state, '캐릭터 생성이 끝나야 전투 행동을 할 수 있습니다.');
  }

  if (state.levelUpPending || state.phase === 'battle-ended' || state.phase === 'floor-cleared' || state.phase === 'reward-pending' || state.phase === 'level-up-pending') {
    return appendLog(state, '정비/보상/레벨업 단계에서는 전투 행동을 할 수 없습니다.');
  }

  if (state.phase !== 'player-main') {
    return appendLog(state, '플레이어 메인턴에서만 행동을 추가할 수 있습니다. 반응턴은 다음 단계에서 구현합니다.');
  }

  if (state.player.hp <= 0) {
    return appendLog(state, '플레이어가 쓰러진 상태라 행동을 추가할 수 없습니다.');
  }

  if (action.type === 'basic-attack' && state.enemy.hp <= 0) {
    return appendLog(state, '적이 이미 쓰러져 기본 공격 행동을 추가할 수 없습니다.');
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
  if (isActionBlockedPhase(state)) {
    return withBattleEndedIfNeeded(state);
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
  if (state.setupMode || state.levelUpPending || state.phase !== 'player-main') {
    return appendLog(state, state.setupMode ? '캐릭터 생성이 끝나야 전투 행동을 할 수 있습니다.' : '정비/보상/레벨업 단계에서는 전투 행동을 할 수 없습니다.');
  }

  let currentState = state;

  for (const action of state.actionQueue) {
    currentState = withBattleEndedIfNeeded(currentState);

    if (currentState.phase === 'battle-ended' || currentState.phase === 'floor-cleared' || currentState.phase === 'reward-pending' || currentState.phase === 'level-up-pending') {
      return currentState;
    }

    currentState = executeQueuedAction(currentState, action);
  }

  return clearActionQueue(withBattleEndedIfNeeded(currentState));
};
