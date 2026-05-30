import { moveCharacterStep } from './movement';
import { beginPlayerReaction } from './reactionFlow';
import { isAdjacent, resolveBasicAttack } from '../rules/combat';
import { appendLog, type Direction, type GameState } from '../state/gameState';

const chooseDirectionTowardPlayer = (state: GameState): Direction => {
  const dx = state.player.position.x - state.enemy.position.x;
  const dy = state.player.position.y - state.enemy.position.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  }

  return dy > 0 ? 'down' : 'up';
};

export const runEnemyMainTurn = (state: GameState): GameState => {
  if (state.setupMode) {
    return state;
  }

  if (
    state.phase === 'battle-ended' ||
    state.phase === 'floor-cleared' ||
    state.phase === 'reward-pending' ||
    state.enemy.hp <= 0 ||
    state.player.hp <= 0
  ) {
    return state;
  }

  const baseState = {
    ...state,
    enemy: { ...state.enemy, guarding: false },
    player: { ...state.player, guarding: false }
  };

  if (isAdjacent(baseState.enemy, baseState.player)) {
    const result = resolveBasicAttack(baseState.enemy, baseState.player);

    return beginPlayerReaction(baseState, `Enemy action: ${result.log}`, result.damage);
  }

  const direction = chooseDirectionTowardPlayer(baseState);
  const movedState = moveCharacterStep(baseState, baseState.enemy.id, direction);

  if (
    movedState.enemy.position.x === baseState.enemy.position.x &&
    movedState.enemy.position.y === baseState.enemy.position.y
  ) {
    return appendLog(movedState, 'Enemy action: movement path is blocked, so the enemy waits.');
  }

  return appendLog(movedState, 'Enemy action: moved toward the player.');
};
