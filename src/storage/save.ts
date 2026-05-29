import { calcDerivedStats } from '../rules/derivedStats';
import { createInitialGameState, type Character, type CoreStats, type GameState } from '../state/gameState';

const SAVE_KEY = 'manrpg-pwa-ai:save:v3';
const LEGACY_SAVE_KEYS = ['manrpg-pwa-ai:save:v2', 'manrpg-pwa-ai:save:v1'];
const SAVE_VERSION = 3;

type SavePayload = {
  saveVersion: number;
  state: GameState;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const isSwordKi = (value: unknown): value is CoreStats['swordKi'] =>
  value === 0 || value === 1 || value === 2 || value === 3 || value === 4 || value === 5 || value === 6;

const isValidCoreStats = (value: unknown): value is CoreStats => {
  if (!isObject(value)) {
    return false;
  }

  return (
    isNumber(value.level) &&
    isNumber(value.strength) &&
    isNumber(value.dexterity) &&
    isNumber(value.constitution) &&
    isNumber(value.intelligence) &&
    isNumber(value.wisdom) &&
    isNumber(value.appearance) &&
    isNumber(value.outerStack) &&
    isNumber(value.innerStack) &&
    isSwordKi(value.swordKi) &&
    isNumber(value.multicasting) &&
    Array.isArray(value.traits) &&
    value.traits.every((trait) => typeof trait === 'string') &&
    isNumber(value.coin)
  );
};

const isValidCharacter = (value: unknown, kind: Character['kind']): value is Character => {
  if (!isObject(value) || !isObject(value.position)) {
    return false;
  }

  return (
    value.kind === kind &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    isNumber(value.position.x) &&
    isNumber(value.position.y) &&
    isValidCoreStats(value.stats) &&
    isNumber(value.hp) &&
    isNumber(value.mp) &&
    typeof value.guarding === 'boolean'
  );
};

const isValidGameState = (value: unknown): value is GameState => {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.setupMode === 'boolean' &&
    isValidCharacter(value.player, 'player') &&
    isValidCharacter(value.enemy, 'enemy') &&
    Array.isArray(value.log) &&
    Array.isArray(value.actionQueue) &&
    typeof value.selectedAction === 'string' &&
    isNumber(value.turn) &&
    typeof value.phase === 'string' &&
    typeof value.turnOwner === 'string' &&
    typeof value.initiative === 'string'
  );
};

const refreshCharacterDerived = (character: Character): Character => ({
  ...character,
  derived: calcDerivedStats(character.stats)
});

const refreshDerivedStats = (state: GameState): GameState => ({
  ...state,
  player: refreshCharacterDerived(state.player),
  enemy: refreshCharacterDerived(state.enemy)
});

export const saveGameStub = (state: GameState): string => {
  const payload: SavePayload = {
    saveVersion: SAVE_VERSION,
    state: refreshDerivedStats(state)
  };

  localStorage.setItem(SAVE_KEY, JSON.stringify(payload));

  return `저장 stub: saveVersion ${SAVE_VERSION} 상태와 행동 큐를 localStorage에 기록했습니다.`;
};

export const loadGameStub = (): GameState => {
  const raw = localStorage.getItem(SAVE_KEY) ?? LEGACY_SAVE_KEYS.map((key) => localStorage.getItem(key)).find((value) => value !== null);

  if (!raw) {
    return createInitialGameState();
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!isObject(parsed) || parsed.saveVersion !== SAVE_VERSION || !isValidGameState(parsed.state)) {
      return createInitialGameState();
    }

    return refreshDerivedStats(parsed.state);
  } catch {
    return createInitialGameState();
  }
};
