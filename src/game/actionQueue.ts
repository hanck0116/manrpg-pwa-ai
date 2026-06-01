import { hasActiveDesireCost } from './halo';
import { useBattleInventoryItem } from './inventory';
import { moveCharacterSteps } from './movement';
import { resolveBasicAttack } from '../rules/combat';
import { resolveSkillUse } from '../rules/skillCombat';
import { resolveSpellCast } from '../rules/spellCombat';
import { resolveTechniqueUse } from '../rules/techniqueCombat';
import { appendLog, type GameState, type QueuedAction } from '../state/gameState';

const terminalPhases: GameState['phase'][] = ['battle-ended', 'floor-cleared', 'reward-pending', 'level-up-pending'];

const isActionBlockedPhase = (state: GameState): boolean =>
  terminalPhases.includes(state.phase) || state.player.hp <= 0 || state.enemy.hp <= 0;

const withBattleEndedIfNeeded = (state: GameState): GameState => {
  if (terminalPhases.includes(state.phase)) {
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
      '층 클리어: 적 HP가 0이 되었습니다. 회복/보상 단계로 이동할 수 있습니다.'
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
      '전투 종료: 플레이어 HP가 0이 되었습니다.'
    );
  }

  return state;
};

export const enqueueAction = (state: GameState, action: QueuedAction): GameState => {
  if (state.setupMode) {
    return appendLog(state, '캐릭터 생성을 완료해야 전투 행동을 추가할 수 있습니다.');
  }

  if (state.levelUpPending || terminalPhases.includes(state.phase)) {
    return appendLog(state, '회복/보상/레벨업/전투 종료 단계에서는 전투 행동을 추가할 수 없습니다.');
  }

  if (state.phase !== 'player-main') {
    return appendLog(state, '플레이어 메인턴에만 행동을 큐에 추가할 수 있습니다.');
  }

  if (hasActiveDesireCost(state) && action.type !== 'wait') {
    return appendLog(state, '욕망의 대가로 행동 불능 상태입니다. 턴 마무리 또는 대기만 가능합니다.');
  }

  if (state.player.hp <= 0) {
    return appendLog(state, '플레이어가 쓰러진 상태라 행동을 추가할 수 없습니다.');
  }

  if (action.type === 'skill' && action.skillId) {
    const skill = state.skills.find((playerSkill) => playerSkill.id === action.skillId);
    if (skill?.kind === 'passive' || skill?.timing === 'passive') {
      return appendLog(state, '패시브 스킬은 전투 큐에 추가할 수 없습니다.');
    }
    if (skill?.timing === 'reaction') {
      return appendLog(state, '반응 스킬은 행동 큐가 아니라 반응턴에서 즉시 사용합니다.');
    }
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

const executeSpellAction = (state: GameState, action: QueuedAction): GameState => {
  if (!action.spellId) {
    return appendLog(state, '시전 실패: 행동 큐에 넣을 보유 마법을 선택해야 합니다.');
  }

  const spell = state.spells.find((knownSpell) => knownSpell.id === action.spellId);

  if (!spell) {
    return appendLog(state, '시전 실패: 보유하지 않은 마법입니다.');
  }

  const result = resolveSpellCast(state.player, state.enemy, spell);

  const nextState = appendLog(
    {
      ...state,
      player: result.caster.kind === 'player' ? result.caster : state.player,
      enemy: result.target.kind === 'enemy' ? result.target : state.enemy
    },
    result.log
  );

  return nextState;
};


const executeTechniqueAction = (state: GameState, action: QueuedAction): GameState => {
  if (!action.techniqueId) {
    return appendLog(state, '기술 사용 실패: 사용할 기술을 선택해야 합니다.');
  }

  const technique = state.techniques.find((playerTechnique) => playerTechnique.id === action.techniqueId);

  if (!technique) {
    return appendLog(state, '기술 사용 실패: 보유하지 않은 기술입니다.');
  }

  const result = resolveTechniqueUse(state.player, state.enemy, technique);

  const nextState = appendLog(
    {
      ...state,
      player: result.player,
      enemy: result.enemy,
      techniques: technique.source === 'halo:fusion' ? state.techniques.filter((known) => known.id !== technique.id) : state.techniques
    },
    result.log
  );

  return nextState;
};

const executeItemAction = (state: GameState, action: QueuedAction): GameState => {
  if (!action.itemId) {
    return appendLog(state, '아이템 사용 실패: 행동 큐에 넣을 아이템을 선택해야 합니다.');
  }

  return useBattleInventoryItem(state, action.itemId);
};

const executeSkillAction = (state: GameState, action: QueuedAction): GameState => {
  if (!action.skillId) {
    return appendLog(state, '스킬 사용 실패: 사용할 스킬을 선택해야 합니다.');
  }

  const skill = state.skills.find((playerSkill) => playerSkill.id === action.skillId);

  if (!skill) {
    return appendLog(state, '스킬 사용 실패: 보유하지 않은 스킬입니다.');
  }

  if (skill.timing !== 'main') {
    return appendLog(state, '스킬 사용 실패: 이번 단계에서는 메인턴 스킬만 전투 큐에서 사용할 수 있습니다.');
  }

  const result = resolveSkillUse(state.player, state.enemy, skill);

  const nextState = appendLog(
    {
      ...state,
      player: result.player,
      enemy: result.enemy
    },
    result.log
  );

  return nextState;
};

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
      return executeSkillAction(baseState, action);
    case 'spell':
      return executeSpellAction(baseState, action);
    case 'technique':
      return executeTechniqueAction(baseState, action);
    case 'item':
      return executeItemAction(baseState, action);
    case 'wait':
      return appendLog(baseState, '플레이어가 대기했습니다.');
  }
};

export const executeActionQueue = (state: GameState): GameState => {
  if (state.setupMode || state.levelUpPending || state.phase !== 'player-main') {
    return appendLog(
      state,
      state.setupMode
        ? '캐릭터 생성을 완료해야 전투 행동을 실행할 수 있습니다.'
        : '플레이어 메인턴에만 전투 행동을 실행할 수 있습니다.'
    );
  }

  let currentState = state;

  for (const action of state.actionQueue) {
    currentState = withBattleEndedIfNeeded(currentState);

    if (terminalPhases.includes(currentState.phase)) {
      return currentState;
    }

    currentState = executeQueuedAction(currentState, action);
  }

  return clearActionQueue(withBattleEndedIfNeeded(currentState));
};
