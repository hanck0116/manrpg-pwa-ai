import { resolveBasicAttack } from '../rules/combat';
import { resolveCounterReaction, resolveDodgeReaction, resolveGuardReaction } from '../rules/reaction';
import { appendLog, type GameState, type QueuedAction } from '../state/gameState';

const finishReaction = (state: GameState): GameState => {
  if (state.enemy.hp <= 0) {
    return appendLog(
      {
        ...state,
        pendingReaction: undefined,
        actionQueue: [],
        phase: 'floor-cleared',
        turnOwner: 'player',
        battleResult: 'win'
      },
      'Reaction resolved: enemy HP reached 0. Floor cleared.'
    );
  }

  const cleared = {
    ...state,
    pendingReaction: undefined,
    actionQueue: [],
    turnOwner: state.player.hp <= 0 ? ('enemy' as const) : ('player' as const),
    phase: state.player.hp <= 0 ? ('battle-ended' as const) : ('player-main' as const),
    battleResult: state.player.hp <= 0 ? ('lose' as const) : state.battleResult
  };

  return state.player.hp <= 0
    ? appendLog(cleared, 'Battle ended: player HP reached 0 during the reaction step.')
    : appendLog(cleared, 'Reaction resolved. Returning to player main phase.');
};

const applyIncomingDamage = (state: GameState, damage: number, log: string): GameState =>
  appendLog(
    {
      ...state,
      player: {
        ...state.player,
        hp: Math.max(0, state.player.hp - damage)
      }
    },
    log
  );

export const beginPlayerReaction = (state: GameState, attackLog: string, damage: number): GameState =>
  appendLog(
    {
      ...state,
      phase: 'player-reaction',
      turnOwner: 'player',
      pendingReaction: {
        against: 'player',
        attackLog,
        damage
      }
    },
    `${attackLog} Choose a reaction. Reactions do not consume the action queue.`
  );

export const resolvePlayerReaction = (state: GameState, reactionType: NonNullable<QueuedAction['reactionType']> | 'none'): GameState => {
  if (state.phase !== 'player-reaction' || !state.pendingReaction) {
    return appendLog(state, 'No pending player reaction to resolve.');
  }

  const incomingDamage = Math.max(0, state.pendingReaction.damage ?? 0);
  let nextState = state;

  if (reactionType === 'dodge') {
    const result = resolveDodgeReaction(state.player, state.enemy);
    nextState = appendLog(nextState, result.log);
    if (!result.success) {
      nextState = applyIncomingDamage(nextState, incomingDamage, `Dodge failed: ${incomingDamage} damage applied.`);
    }
    return finishReaction(nextState);
  }

  if (reactionType === 'guard') {
    const result = resolveGuardReaction(state.player, state.enemy);
    nextState = appendLog(nextState, result.log);
    if (!result.success) {
      const reducedDamage = Math.max(0, incomingDamage - 1);
      nextState = applyIncomingDamage(nextState, reducedDamage, `Guard failed: damage reduced by 1, ${reducedDamage} damage applied.`);
    }
    return finishReaction(nextState);
  }

  if (reactionType === 'counter') {
    const result = resolveCounterReaction(state.player, state.enemy);
    nextState = appendLog(nextState, result.log);

    if (result.success) {
      const counter = resolveBasicAttack(state.player, state.enemy);
      nextState = appendLog(
        {
          ...nextState,
          enemy: { ...nextState.enemy, hp: counter.targetHp }
        },
        `Counter attack: ${counter.log}`
      );
    } else {
      nextState = applyIncomingDamage(nextState, incomingDamage, `Counter failed: ${incomingDamage} damage applied.`);
    }

    return finishReaction(nextState);
  }

  nextState = applyIncomingDamage(nextState, incomingDamage, `No reaction: ${incomingDamage} damage applied.`);
  return finishReaction(nextState);
};
