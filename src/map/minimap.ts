import { isAdjacent } from '../rules/combat';
import type { GameState, Position } from '../state/gameState';
import { MAP_SIZE, isWalkable } from './fixedMap';

const getCardinalInfo = (position: Position): string => {
  const cardinals = [
    { label: '북', x: position.x, y: position.y - 1 },
    { label: '동', x: position.x + 1, y: position.y },
    { label: '남', x: position.x, y: position.y + 1 },
    { label: '서', x: position.x - 1, y: position.y }
  ];

  return cardinals
    .map((direction) => `${direction.label}:${isWalkable(direction.x, direction.y) ? '이동 가능' : '벽/경계'}`)
    .join(' · ');
};

const getRelativeDirection = (from: Position, to: Position): string => {
  const horizontal = to.x > from.x ? '동' : to.x < from.x ? '서' : '';
  const vertical = to.y > from.y ? '남' : to.y < from.y ? '북' : '';

  return `${vertical}${horizontal}` || '같은 칸';
};

const getDistance = (from: Position, to: Position): number =>
  Math.abs(from.x - to.x) + Math.abs(from.y - to.y);

export const getMinimapSummary = (state: GameState): string => {
  const player = `플레이어 (${state.player.position.x + 1}, ${state.player.position.y + 1})`;
  const enemy = `적 ${getRelativeDirection(state.player.position, state.enemy.position)}쪽 ${getDistance(
    state.player.position,
    state.enemy.position
  )}칸`;
  const threat = isAdjacent(state.player, state.enemy) ? '근접 위협' : '근접 위협 없음';

  return `${MAP_SIZE}x${MAP_SIZE} 고정 맵 · ${player} · ${getCardinalInfo(
    state.player.position
  )} · ${enemy} · ${threat} · 계단 미구현 · 적은 항상 1명`;
};
