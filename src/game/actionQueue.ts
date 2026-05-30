import { useBattleInventoryItem } from './inventory';
import { moveCharacterSteps } from './movement';
import { resolveBasicAttack } from '../rules/combat';
import { resolveSpellCast } from '../rules/spellCombat';
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
      'Floor cleared: enemy HP reached 0. Move to recovery/reward.'
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
      'Battle ended: player HP reached 0.'
    );
  }

  return state;
};

export const enqueueAction = (state: GameState, action: QueuedAction): GameState => {
  if (state.setupMode) {
    return appendLog(state, 'Finish character setup before adding battle actions.');
  }

  if (state.levelUpPending || terminalPhases.includes(state.phase)) {
    return appendLog(state, 'Battle actions cannot be added during recovery/reward/level-up/end phases.');
  }

  if (state.phase !== 'player-main') {
    return appendLog(state, 'Actions can only be queued during the player main phase.');
  }

  if (state.player.hp <= 0) {
    return appendLog(state, 'The player is down and cannot add actions.');
  }

  if (action.type === 'basic-attack' && state.enemy.hp <= 0) {
    return appendLog(state, 'The enemy is already down.');
  }

  return appendLog(
    {
      ...state,
      actionQueue: [...state.actionQueue, action],
      selectedAction: action.label
    },
    `Queued action: ${action.label}`
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
    return appendLog(state, 'Cast failed: choose a known spell before queuing a spell action.');
  }

  const spell = state.spells.find((knownSpell) => knownSpell.id === action.spellId);

  if (!spell) {
    return appendLog(state, 'Cast failed: the selected spell is not known.');
  }

  const result = resolveSpellCast(state.player, state.enemy, spell);

  return appendLog(
    {
      ...state,
      player: result.caster.kind === 'player' ? result.caster : state.player,
      enemy: result.target.kind === 'enemy' ? result.target : state.enemy
    },
    result.log
  );
};

const executeItemAction = (state: GameState, action: QueuedAction): GameState => {
  if (!action.itemId) {
    return appendLog(state, 'Use item failed: choose an item before queuing an item action.');
  }

  return useBattleInventoryItem(state, action.itemId);
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
        'Player takes a guard stance.'
      );
    case 'skill':
      return appendLog(baseState, 'Skill effects are TODO until the source rule is mapped.');
    case 'spell':
      return executeSpellAction(baseState, action);
    case 'item':
      return executeItemAction(baseState, action);
    case 'wait':
      return appendLog(baseState, 'Player waits.');
  }
};

export const executeActionQueue = (state: GameState): GameState => {
  if (state.setupMode || state.levelUpPending || state.phase !== 'player-main') {
    return appendLog(
      state,
      state.setupMode
        ? 'Finish character setup before executing battle actions.'
        : 'Battle actions can only execute during the player main phase.'
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
