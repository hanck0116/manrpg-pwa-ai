import { createInitialGameState, type GameState } from '../state/gameState';

const SAVE_KEY = 'manrpg-pwa-ai:save:v1';
const SAVE_VERSION = 1;

type SavePayload = {
  saveVersion: number;
  state: GameState;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isValidGameState = (value: unknown): value is GameState => {
  if (!isObject(value)) {
    return false;
  }

  return (
    isObject(value.player) &&
    isObject(value.enemy) &&
    Array.isArray(value.log) &&
    Array.isArray(value.actionQueue) &&
    typeof value.turn === 'number' &&
    typeof value.phase === 'string' &&
    typeof value.turnOwner === 'string' &&
    typeof value.initiative === 'string'
  );
};

export const saveGameStub = (state: GameState): string => {
  const payload: SavePayload = {
    saveVersion: SAVE_VERSION,
    state
  };

  localStorage.setItem(SAVE_KEY, JSON.stringify(payload));

  return `저장 stub: saveVersion ${SAVE_VERSION} 상태와 행동 큐를 localStorage에 기록했습니다.`;
};

export const loadGameStub = (): GameState => {
  const raw = localStorage.getItem(SAVE_KEY);

  if (!raw) {
    return createInitialGameState();
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!isObject(parsed) || parsed.saveVersion !== SAVE_VERSION || !isValidGameState(parsed.state)) {
      return createInitialGameState();
    }

    return parsed.state;
  } catch {
    return createInitialGameState();
  }
};
