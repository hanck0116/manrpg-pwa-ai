import { calcDerivedStats } from '../rules/derivedStats';
import { createInitialGameState, type Character, type CoreStats, type GameState, type LearnedSpell, type RewardItem, type RewardState } from '../state/gameState';

const SAVE_KEY = 'manrpg-pwa-ai:save:v8';
const LEGACY_SAVE_KEYS = [
  'manrpg-pwa-ai:save:v7',
  'manrpg-pwa-ai:save:v6',
  'manrpg-pwa-ai:save:v5',
  'manrpg-pwa-ai:save:v4',
  'manrpg-pwa-ai:save:v3',
  'manrpg-pwa-ai:save:v2',
  'manrpg-pwa-ai:save:v1'
];
const SAVE_VERSION = 8;

type SavePayload = {
  saveVersion: number;
  state: GameState;
};

const validPhases = ['player-main', 'player-reaction', 'enemy-main', 'enemy-reaction', 'floor-cleared', 'reward-pending', 'level-up-pending', 'battle-ended'];
const validRewardTypes: RewardItem['type'][] = ['coin', 'martial', 'magicBook', 'multi', 'reset', 'trait', 'special', 'item'];
const validActionTypes = ['move', 'basic-attack', 'skill', 'spell', 'item', 'defend', 'wait'];
const validReactionTypes = ['dodge', 'guard', 'counter'];

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

const isValidRewardItem = (value: unknown): value is RewardItem => {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    validRewardTypes.includes(value.type as RewardItem['type']) &&
    (value.coin === undefined || isNumber(value.coin)) &&
    (value.grade === undefined || typeof value.grade === 'string') &&
    (value.sell === undefined || isNumber(value.sell)) &&
    (value.mode === undefined || value.mode === 'random' || value.mode === 'select') &&
    (value.learnedSpellName === undefined || typeof value.learnedSpellName === 'string') &&
    (value.learnedCircle === undefined || isNumber(value.learnedCircle))
  );
};

const isValidLearnedSpell = (value: unknown): value is LearnedSpell => {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    isNumber(value.circle) &&
    typeof value.grade === 'string' &&
    (value.sourceItemName === undefined || typeof value.sourceItemName === 'string')
  );
};

const isValidRewardState = (value: unknown): value is RewardState => {
  if (!isObject(value)) {
    return false;
  }

  return (
    Array.isArray(value.offered) &&
    value.offered.every(isValidRewardItem) &&
    Array.isArray(value.selectedIds) &&
    value.selectedIds.every((id) => typeof id === 'string') &&
    isNumber(value.offerCount) &&
    isNumber(value.pickCount) &&
    typeof value.claimed === 'boolean'
  );
};

const isValidQueuedAction = (value: unknown): boolean => {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    validActionTypes.includes(value.type as string) &&
    (value.direction === undefined || value.direction === 'up' || value.direction === 'down' || value.direction === 'left' || value.direction === 'right') &&
    (value.steps === undefined || isNumber(value.steps)) &&
    (value.spellId === undefined || typeof value.spellId === 'string') &&
    (value.itemId === undefined || typeof value.itemId === 'string') &&
    (value.reactionType === undefined || validReactionTypes.includes(value.reactionType as string))
  );
};

const isValidPendingReaction = (value: unknown): boolean => {
  if (!isObject(value)) {
    return false;
  }

  return (
    (value.against === 'player' || value.against === 'enemy') &&
    typeof value.attackLog === 'string' &&
    (value.damage === undefined || isNumber(value.damage))
  );
};

const isValidGameState = (value: unknown): value is GameState => {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.setupMode === 'boolean' &&
    typeof value.levelUpPending === 'boolean' &&
    isNumber(value.floor) &&
    isValidCharacter(value.player, 'player') &&
    isValidCharacter(value.enemy, 'enemy') &&
    Array.isArray(value.log) &&
    Array.isArray(value.actionQueue) &&
    value.actionQueue.every(isValidQueuedAction) &&
    typeof value.selectedAction === 'string' &&
    isNumber(value.turn) &&
    validPhases.includes(value.phase as string) &&
    (value.turnOwner === 'player' || value.turnOwner === 'enemy') &&
    (value.initiative === 'player' || value.initiative === 'enemy') &&
    Array.isArray(value.inventory) &&
    value.inventory.every(isValidRewardItem) &&
    Array.isArray(value.spells) &&
    value.spells.every(isValidLearnedSpell) &&
    (value.rewardState === undefined || isValidRewardState(value.rewardState)) &&
    (value.pendingReaction === undefined || isValidPendingReaction(value.pendingReaction))
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

  return `저장 stub: saveVersion ${SAVE_VERSION} 상태, 층, 보상, 인벤토리, 보유 마법을 localStorage에 기록했습니다.`;
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
