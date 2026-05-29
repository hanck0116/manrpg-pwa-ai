import { isWalkable } from '../map/fixedMap';
import { appendLog, type Direction, type GameState, type Position } from '../state/gameState';

export const getNextPosition = (position: Position, direction: Direction): Position => {
  switch (direction) {
    case 'up':
      return { x: position.x, y: position.y - 1 };
    case 'down':
      return { x: position.x, y: position.y + 1 };
    case 'left':
      return { x: position.x - 1, y: position.y };
    case 'right':
      return { x: position.x + 1, y: position.y };
  }
};

export const getDirectionLabel = (direction: Direction): string => {
  switch (direction) {
    case 'up':
      return '위';
    case 'down':
      return '아래';
    case 'left':
      return '왼쪽';
    case 'right':
      return '오른쪽';
  }
};

export const canMoveTo = (state: GameState, position: Position): boolean => {
  const occupiedByLivingEnemy =
    state.enemy.hp > 0 && state.enemy.position.x === position.x && state.enemy.position.y === position.y;
  const occupiedByLivingPlayer =
    state.player.hp > 0 && state.player.position.x === position.x && state.player.position.y === position.y;

  return isWalkable(position.x, position.y) && !occupiedByLivingEnemy && !occupiedByLivingPlayer;
};

export const moveCharacterStep = (state: GameState, actorId: string, direction: Direction): GameState => {
  const actor = state.player.id === actorId ? state.player : state.enemy.id === actorId ? state.enemy : undefined;

  if (!actor) {
    return appendLog(state, `이동 실패: ${actorId} 대상을 찾을 수 없습니다.`);
  }

  const target = getNextPosition(actor.position, direction);

  if (!canMoveTo(state, target)) {
    return appendLog(state, `${actor.name}은(는) ${getDirectionLabel(direction)}으로 이동할 수 없습니다.`);
  }

  const nextActor = { ...actor, position: target };
  const nextState =
    actor.kind === 'player' ? { ...state, player: nextActor } : { ...state, enemy: nextActor };

  return appendLog(nextState, `${actor.name}이(가) ${getDirectionLabel(direction)}으로 1칸 이동했습니다.`);
};

export const moveCharacterSteps = (
  state: GameState,
  actorId: string,
  direction: Direction,
  steps: number
): GameState => {
  const totalSteps = Math.max(1, Math.min(3, Math.floor(steps)));
  let currentState = state;

  for (let step = 0; step < totalSteps; step += 1) {
    const before = currentState.player.id === actorId ? currentState.player.position : currentState.enemy.position;
    const movedState = moveCharacterStep(currentState, actorId, direction);
    const after = movedState.player.id === actorId ? movedState.player.position : movedState.enemy.position;

    currentState = movedState;

    if (before.x === after.x && before.y === after.y) {
      break;
    }
  }

  return currentState;
};
