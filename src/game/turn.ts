import { executeActionQueue } from './actionQueue';
import { runEnemyMainTurn } from './enemyAI';
import { appendLog, createInitialGameState, type GameState } from '../state/gameState';

const withBattleEndIfNeeded = (state: GameState): GameState => {
  if (state.phase === 'battle-ended') {
    return state;
  }

  if (state.enemy.hp <= 0) {
    return appendLog(
      {
        ...state,
        phase: 'battle-ended',
        battleResult: 'win',
        turnOwner: 'player',
        actionQueue: []
      },
      '전투 종료: 적이 쓰러졌습니다. 승리!'
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
      '전투 종료: 플레이어가 쓰러졌습니다. 패배.'
    );
  }

  return state;
};

const recoverPlayerMp = (state: GameState): GameState => ({
  ...state,
  player: {
    ...state.player,
    mp: Math.min(state.player.derived.maxMP, state.player.mp + state.player.derived.mpRegen)
  }
});

const runAutomaticEnemyTurn = (state: GameState): GameState => {
  const enemyTurnState = appendLog(
    {
      ...state,
      phase: 'enemy-main',
      turnOwner: 'enemy',
      turn: state.turn + 1
    },
    '플레이어 메인턴을 마무리했습니다. MP가 회복되고 적 메인턴을 자동 진행합니다.'
  );

  const afterEnemyAction = runEnemyMainTurn(enemyTurnState);
  const endedAfterEnemyAction = withBattleEndIfNeeded(afterEnemyAction);

  if (endedAfterEnemyAction.phase === 'battle-ended') {
    return endedAfterEnemyAction;
  }

  return appendLog(
    {
      ...endedAfterEnemyAction,
      phase: 'player-main',
      turnOwner: 'player'
    },
    '적 메인턴이 자동 종료되었습니다. 플레이어 메인턴으로 돌아옵니다.'
  );
};

export const startBattle = (): GameState => createInitialGameState();

export const applyQueuedPlayerActions = (state: GameState): GameState => {
  if (state.phase !== 'player-main') {
    return appendLog(state, '플레이어 메인턴이 아니라 행동 큐를 실행할 수 없습니다.');
  }

  if (state.actionQueue.length === 0) {
    return appendLog(state, '행동 큐가 비어 있습니다. 대기한 것으로 처리합니다.');
  }

  return executeActionQueue(state);
};

export const finishPlayerMainTurn = (state: GameState): GameState => {
  if (state.phase !== 'player-main') {
    return appendLog(state, '현재는 플레이어 메인턴이 아닙니다.');
  }

  const afterActions = applyQueuedPlayerActions(state);
  const endedAfterActions = withBattleEndIfNeeded(afterActions);

  if (endedAfterActions.phase === 'battle-ended') {
    return endedAfterActions;
  }

  const recoveredState = recoverPlayerMp(endedAfterActions);

  return runAutomaticEnemyTurn(recoveredState);
};

export const finishEnemyMainTurn = (state: GameState): GameState => {
  if (state.phase !== 'enemy-main') {
    return appendLog(state, '현재는 적 메인턴이 아닙니다.');
  }

  const afterEnemyAction = runEnemyMainTurn(state);
  const endedAfterEnemyAction = withBattleEndIfNeeded(afterEnemyAction);

  if (endedAfterEnemyAction.phase === 'battle-ended') {
    return endedAfterEnemyAction;
  }

  return appendLog(
    {
      ...endedAfterEnemyAction,
      phase: 'player-main',
      turnOwner: 'player'
    },
    '적 메인턴이 끝났습니다. 플레이어 메인턴으로 돌아옵니다.'
  );
};

export const advanceTurn = (state: GameState): GameState => {
  switch (state.phase) {
    case 'player-main':
      return finishPlayerMainTurn(state);
    case 'enemy-main':
      return finishEnemyMainTurn(state);
    case 'player-reaction':
    case 'enemy-reaction':
      // TODO: 반응은 턴을 소모하지 않는다는 원칙으로 다음 단계에서 실제 구현합니다.
      return appendLog(state, '반응턴은 다음 단계에서 구현합니다. 반응은 턴을 소모하지 않습니다.');
    case 'battle-ended':
      return appendLog(state, '이미 전투가 종료되었습니다. 새 전투 시작 버튼으로 같은 고정 맵에서 다시 시작할 수 있습니다.');
  }
};
