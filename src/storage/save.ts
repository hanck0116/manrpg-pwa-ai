import { createInitialGameState, type GameState } from '../state/gameState';

const SAVE_KEY = 'manrpg-pwa-ai:save:v1';

export const saveGameStub = (state: GameState): string => {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));

  return '저장 stub: 현재 상태를 localStorage에 기록했습니다.';
};

export const loadGameStub = (): GameState => {
  const raw = localStorage.getItem(SAVE_KEY);

  if (!raw) {
    return createInitialGameState();
  }

  try {
    return JSON.parse(raw) as GameState;
  } catch {
    return createInitialGameState();
  }
};
