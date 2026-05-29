import { moveCharacterStep } from './movement';
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

  if (state.phase === 'battle-ended' || state.enemy.hp <= 0 || state.player.hp <= 0) {
    return state;
  }

  const baseState = {
    ...state,
    enemy: { ...state.enemy, guarding: false },
    player: { ...state.player, guarding: false }
  };

  if (isAdjacent(baseState.enemy, baseState.player)) {
    const result = resolveBasicAttack(baseState.enemy, baseState.player);

    return appendLog(
      {
        ...baseState,
        player: { ...baseState.player, hp: result.targetHp }
      },
      `적 행동: ${result.log}`
    );
  }

  const direction = chooseDirectionTowardPlayer(baseState);
  const movedState = moveCharacterStep(baseState, baseState.enemy.id, direction);

  if (
    movedState.enemy.position.x === baseState.enemy.position.x &&
    movedState.enemy.position.y === baseState.enemy.position.y
  ) {
    return appendLog(movedState, '적 행동: 이동 경로가 막혀 대기했습니다.');
  }

  return appendLog(movedState, '적 행동: 플레이어 방향으로 접근했습니다.');
};
