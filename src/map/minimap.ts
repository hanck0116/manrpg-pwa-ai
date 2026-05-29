import type { GameState } from '../state/gameState';
import { MAP_SIZE } from './fixedMap';

export const getMinimapSummary = (state: GameState): string => {
  const player = `플레이어 (${state.player.position.x + 1}, ${state.player.position.y + 1})`;
  const enemy = `적 (${state.enemy.position.x + 1}, ${state.enemy.position.y + 1})`;

  return `${MAP_SIZE}x${MAP_SIZE} 고정 맵 · ${player} · ${enemy} · 적은 항상 1명`;
};
