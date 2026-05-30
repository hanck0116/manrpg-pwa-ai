import { executeActionQueue } from './actionQueue';
import { runEnemyMainTurn } from './enemyAI';
import { resolvePlayerReaction } from './reactionFlow';
import { appendLog, createInitialEnemy, type Character, type GameState } from '../state/gameState';

const withBattleEndIfNeeded = (state: GameState): GameState => {
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
      '전투 종료: 플레이어가 쓰러졌습니다. 패배.'
    );
  }

  return state;
};

const recoverCharacter = (character: Character, position: Character['position']): Character => ({
  ...character,
  position,
  hp: character.derived.maxHP,
  mp: character.derived.maxMP,
  guarding: false
});

export const createNewBattleFromPlayer = (state: GameState): GameState => {
  if (state.setupMode) {
    return appendLog(state, '캐릭터 생성이 끝나야 전투 행동을 할 수 있습니다.');
  }

  if (state.phase !== 'battle-ended') {
    return appendLog(state, '전투 종료 상태에서만 새 전투를 시작할 수 있습니다.');
  }

  const player = recoverCharacter(state.player, { x: 3, y: 5 });
  const enemy = createInitialEnemy();
  const initiative = enemy.stats.dexterity > player.stats.dexterity ? 'enemy' : 'player';

  return appendLog(
    {
      ...state,
      setupMode: false,
      levelUpPending: false,
      turn: 1,
      player,
      enemy,
      selectedAction: '대기',
      phase: initiative === 'player' ? 'player-main' : 'enemy-main',
      initiative,
      actionQueue: [],
      turnOwner: initiative,
      battleResult: undefined
    },
    '새 전투를 시작했습니다. 플레이어 스탯 배분은 유지하고 HP/MP와 적 1명만 초기화했습니다.'
  );
};

const recoverPlayerMp = (state: GameState): GameState => ({
  ...state,
  player: {
    ...state.player,
    mp: Math.min(state.player.derived.maxMP, state.player.mp + state.player.derived.mpRegen)
  }
});

const runAutomaticEnemyTurn = (state: GameState): GameState => {
  if (state.setupMode || state.levelUpPending) {
    return state;
  }

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

  if (
    endedAfterEnemyAction.phase === 'battle-ended' ||
    endedAfterEnemyAction.phase === 'floor-cleared' ||
    endedAfterEnemyAction.phase === 'reward-pending' ||
    endedAfterEnemyAction.phase === 'level-up-pending' ||
    endedAfterEnemyAction.phase === 'player-reaction'
  ) {
    return endedAfterEnemyAction;
  }

  return appendLog(
    {
      ...endedAfterEnemyAction,
      player: { ...endedAfterEnemyAction.player, guarding: false },
      phase: 'player-main',
      turnOwner: 'player'
    },
    '적 메인턴이 자동 종료되었습니다. 플레이어 메인턴으로 돌아옵니다.'
  );
};

export const applyQueuedPlayerActions = (state: GameState): GameState => {
  if (state.setupMode || state.levelUpPending) {
    return appendLog(state, state.setupMode ? '캐릭터 생성이 끝나야 전투 행동을 할 수 있습니다.' : '정비/보상/레벨업 단계에서는 전투 행동을 할 수 없습니다.');
  }

  if (state.phase !== 'player-main') {
    return appendLog(state, '플레이어 메인턴이 아니라 행동 큐를 실행할 수 없습니다.');
  }

  if (state.actionQueue.length === 0) {
    return appendLog(state, '행동 큐가 비어 있습니다. 대기한 것으로 처리합니다.');
  }

  return executeActionQueue(state);
};

export const finishPlayerMainTurn = (state: GameState): GameState => {
  if (state.setupMode || state.levelUpPending) {
    return appendLog(state, state.setupMode ? '캐릭터 생성이 끝나야 전투 행동을 할 수 있습니다.' : '정비/보상/레벨업 단계에서는 전투 행동을 할 수 없습니다.');
  }

  if (state.phase !== 'player-main') {
    return appendLog(state, '현재는 플레이어 메인턴이 아닙니다.');
  }

  const afterActions = applyQueuedPlayerActions(state);
  const endedAfterActions = withBattleEndIfNeeded(afterActions);

  if (
    endedAfterActions.phase === 'battle-ended' ||
    endedAfterActions.phase === 'floor-cleared' ||
    endedAfterActions.phase === 'reward-pending' ||
    endedAfterActions.phase === 'level-up-pending'
  ) {
    return endedAfterActions;
  }

  const recoveredState = recoverPlayerMp(endedAfterActions);

  return runAutomaticEnemyTurn(recoveredState);
};

export const finishEnemyMainTurn = (state: GameState): GameState => {
  if (state.setupMode || state.levelUpPending) {
    return appendLog(state, state.setupMode ? '캐릭터 생성이 끝나야 전투 행동을 할 수 있습니다.' : '정비/보상/레벨업 단계에서는 전투 행동을 할 수 없습니다.');
  }

  if (state.phase !== 'enemy-main') {
    return appendLog(state, '현재는 적 메인턴이 아닙니다.');
  }

  const afterEnemyAction = runEnemyMainTurn(state);
  const endedAfterEnemyAction = withBattleEndIfNeeded(afterEnemyAction);

  if (
    endedAfterEnemyAction.phase === 'battle-ended' ||
    endedAfterEnemyAction.phase === 'floor-cleared' ||
    endedAfterEnemyAction.phase === 'reward-pending' ||
    endedAfterEnemyAction.phase === 'level-up-pending' ||
    endedAfterEnemyAction.phase === 'player-reaction'
  ) {
    return endedAfterEnemyAction;
  }

  return appendLog(
    {
      ...endedAfterEnemyAction,
      player: { ...endedAfterEnemyAction.player, guarding: false },
      phase: 'player-main',
      turnOwner: 'player'
    },
    '적 메인턴이 끝났습니다. 플레이어 메인턴으로 돌아옵니다.'
  );
};

export const advanceTurn = (state: GameState): GameState => {
  if (state.setupMode || state.levelUpPending) {
    return appendLog(state, state.setupMode ? '캐릭터 생성이 끝나야 전투 행동을 할 수 있습니다.' : '정비/보상/레벨업 단계에서는 전투 행동을 할 수 없습니다.');
  }

  switch (state.phase) {
    case 'player-main':
      return finishPlayerMainTurn(state);
    case 'enemy-main':
      return finishEnemyMainTurn(state);
    case 'player-reaction':
      return resolvePlayerReaction(state, 'none');
    case 'enemy-reaction':
      // TODO: 반응은 턴을 소모하지 않는다는 원칙으로 다음 단계에서 실제 구현합니다.
      return appendLog(state, '반응턴은 다음 단계에서 구현합니다. 반응은 턴을 소모하지 않습니다.');
    case 'floor-cleared':
      return appendLog(state, '층 클리어 상태입니다. 회복/정비와 보상 선택을 진행하세요.');
    case 'reward-pending':
      return appendLog(state, '보상 선택 단계입니다. 다음 층 진입 후 전투 행동이 가능합니다.');
    case 'level-up-pending':
      return appendLog(state, '레벨업 스탯 분배 단계입니다. 남은 포인트를 모두 분배해야 다음 층에 진입할 수 있습니다.');
    case 'battle-ended':
      return appendLog(state, '전투가 종료되었습니다. 패배 상태에서는 새 전투 시작으로 같은 고정 맵에서 다시 시작할 수 있습니다.');
  }
};
