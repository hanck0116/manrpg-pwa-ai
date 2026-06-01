import { calcDerivedStats } from '../rules/derivedStats';
import { applyEquipmentBonuses } from '../rules/equipment';
import { applyPassiveSkillStats } from '../rules/passiveSkill';
import {
  createInitialGameState,
  type Character,
  type CoreStats,
  type EquipmentItem,
  type EquipmentLoadout,
  type GameState,
  type HaloKind,
  type HaloState,
  type LearnedSpell,
  type PendingChoice,
  type PendingChoiceOption,
  type PlayerSkill,
  type PlayerTechnique,
  type RewardItem,
  type RewardState,
  type StatusEffect
} from '../state/gameState';

export const SAVE_KEY = 'manrpg-pwa-ai:save:v17';
export const LEGACY_SAVE_KEYS = [
  'manrpg-pwa-ai:save:v16',
  'manrpg-pwa-ai:save:v15',
  'manrpg-pwa-ai:save:v14',
  'manrpg-pwa-ai:save:v13',
  'manrpg-pwa-ai:save:v12',
  'manrpg-pwa-ai:save:v11',
  'manrpg-pwa-ai:save:v10',
  'manrpg-pwa-ai:save:v9',
  'manrpg-pwa-ai:save:v8',
  'manrpg-pwa-ai:save:v7',
  'manrpg-pwa-ai:save:v6',
  'manrpg-pwa-ai:save:v5',
  'manrpg-pwa-ai:save:v4',
  'manrpg-pwa-ai:save:v3',
  'manrpg-pwa-ai:save:v2',
  'manrpg-pwa-ai:save:v1'
];
export const SAVE_VERSION = 17;

type SavePayload = {
  saveVersion: number;
  state: GameState;
};

const validPhases = ['player-main', 'player-reaction', 'enemy-main', 'enemy-reaction', 'floor-cleared', 'reward-pending', 'level-up-pending', 'battle-ended'];
const validRewardTypes: RewardItem['type'][] = ['coin', 'martial', 'magicBook', 'magicTicket', 'choice', 'multiItem', 'multi', 'reset', 'trait', 'special', 'item', 'equipment'];
const validActionTypes = ['move', 'basic-attack', 'skill', 'spell', 'technique', 'item', 'defend', 'wait'];
const validHaloKinds: HaloKind[] = ['amplification', 'extinction', 'birth', 'fusion', 'decomposition', 'existence', 'achievement', 'desire', 'satan'];
const validReactionSourceTypes = ['basic', 'skill', 'technique', 'spell'];
const validStatusKinds: StatusEffect['kind'][] = ['control', 'buff', 'debuff', 'special'];
const validReactionTypes = ['dodge', 'guard', 'counter'];
const validEquipmentSlots: EquipmentItem['slot'][] = ['weapon', 'armor', 'accessory'];
const validEquipmentStatKeys = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'appearance'];
const validEquipmentDerivedKeys = ['attack', 'maxHP', 'maxMP', 'mpRegen'];
const validSkillResourceTypes: PlayerSkill['resourceType'][] = ['outer', 'inner', 'sword', 'magic', 'none'];
const validSkillTimings: PlayerSkill['timing'][] = ['main', 'reaction', 'passive'];
const validSkillEffectTypes: PlayerSkill['effectType'][] = ['damage', 'heal', 'guard', 'todo'];
const validTechniqueKinds: PlayerTechnique['kind'][] = ['attack', 'defense', 'heal', 'buff', 'debuff', 'move', 'special'];
const validSkillKinds: NonNullable<PlayerSkill['kind']>[] = [...validTechniqueKinds, 'passive'];
const validTechniqueJudgeStats: PlayerTechnique['judgeStat'][] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'appearance', 'none'];
const validPassiveStats: NonNullable<PlayerSkill['passiveStat']>[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'appearance'];

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const isSwordKi = (value: unknown): value is CoreStats['swordKi'] =>
  value === 0 || value === 1 || value === 2 || value === 3 || value === 4 || value === 5 || value === 6;

const isValidNumberRecord = (value: unknown, validKeys: string[]): boolean => {
  if (!isObject(value)) {
    return false;
  }

  return Object.entries(value).every(([key, recordValue]) => validKeys.includes(key) && isNumber(recordValue));
};

const isValidEquipmentItem = (value: unknown): value is EquipmentItem => {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    validEquipmentSlots.includes(value.slot as EquipmentItem['slot']) &&
    (value.grade === undefined || typeof value.grade === 'string') &&
    (value.statBonus === undefined || isValidNumberRecord(value.statBonus, validEquipmentStatKeys)) &&
    (value.derivedBonus === undefined || isValidNumberRecord(value.derivedBonus, validEquipmentDerivedKeys)) &&
    (value.sell === undefined || isNumber(value.sell)) &&
    (value.source === undefined || typeof value.source === 'string')
  );
};

const isValidEquipmentLoadout = (value: unknown): value is EquipmentLoadout => {
  if (!isObject(value)) {
    return false;
  }

  return (
    Object.keys(value).every((key) => validEquipmentSlots.includes(key as EquipmentItem['slot'])) &&
    (value.weapon === undefined || isValidEquipmentItem(value.weapon)) &&
    (value.armor === undefined || isValidEquipmentItem(value.armor)) &&
    (value.accessory === undefined || isValidEquipmentItem(value.accessory))
  );
};

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
    (value.learnedCircle === undefined || isNumber(value.learnedCircle)) &&
    (value.choices === undefined || (Array.isArray(value.choices) && value.choices.every((choice) => typeof choice === 'string'))) &&
    (value.itemName === undefined || typeof value.itemName === 'string') &&
    (value.count === undefined || isNumber(value.count)) &&
    (value.equipment === undefined || isValidEquipmentItem(value.equipment))
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
    (value.skillId === undefined || typeof value.skillId === 'string') &&
    (value.spellId === undefined || typeof value.spellId === 'string') &&
    (value.techniqueId === undefined || typeof value.techniqueId === 'string') &&
    (value.itemId === undefined || typeof value.itemId === 'string') &&
    (value.reactionType === undefined || validReactionTypes.includes(value.reactionType as string))
  );
};

const isValidPlayerSkill = (value: unknown): value is PlayerSkill => {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    (value.description === undefined || typeof value.description === 'string') &&
    validSkillResourceTypes.includes(value.resourceType as PlayerSkill['resourceType']) &&
    validSkillTimings.includes(value.timing as PlayerSkill['timing']) &&
    isNumber(value.multiplier) &&
    (value.cost === undefined || isNumber(value.cost)) &&
    (value.range === undefined || isNumber(value.range)) &&
    (value.target === 'enemy' || value.target === 'self') &&
    validSkillEffectTypes.includes(value.effectType as PlayerSkill['effectType']) &&
    (value.source === undefined || typeof value.source === 'string') &&
    (value.mpDelta === undefined || isNumber(value.mpDelta)) &&
    (value.hpDelta === undefined || isNumber(value.hpDelta)) &&
    (value.damageMultiplier === undefined || isNumber(value.damageMultiplier)) &&
    (value.judgeStat === undefined || validTechniqueJudgeStats.includes(value.judgeStat as PlayerTechnique['judgeStat'])) &&
    (value.judgeBonus === undefined || isNumber(value.judgeBonus)) &&
    (value.kind === undefined || validSkillKinds.includes(value.kind as NonNullable<PlayerSkill['kind']>)) &&
    (value.passiveStat === undefined || validPassiveStats.includes(value.passiveStat as NonNullable<PlayerSkill['passiveStat']>)) &&
    (value.passiveValue === undefined || isNumber(value.passiveValue))
  );
};


const isValidPlayerTechnique = (value: unknown): value is PlayerTechnique => {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.source === 'string' &&
    validTechniqueKinds.includes(value.kind as PlayerTechnique['kind']) &&
    isNumber(value.mpDelta) &&
    isNumber(value.hpDelta) &&
    isNumber(value.damageMultiplier) &&
    value.damageMultiplier >= 0 &&
    validTechniqueJudgeStats.includes(value.judgeStat as PlayerTechnique['judgeStat']) &&
    isNumber(value.judgeBonus) &&
    (value.description === undefined || typeof value.description === 'string')
  );
};

const isValidPendingReaction = (value: unknown): boolean => {
  if (!isObject(value)) {
    return false;
  }

  return (
    (value.against === 'player' || value.against === 'enemy') &&
    typeof value.attackLog === 'string' &&
    (value.damage === undefined || isNumber(value.damage)) &&
    (value.sourceType === undefined || validReactionSourceTypes.includes(value.sourceType as string))
  );
};

const isValidPendingChoiceOption = (value: unknown): value is PendingChoiceOption => {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    typeof value.value === 'string' &&
    (value.meta === undefined ||
      (isObject(value.meta) && Object.values(value.meta).every((metaValue) => typeof metaValue === 'string' || isNumber(metaValue))))
  );
};

const isValidPendingChoice = (value: unknown): value is PendingChoice => {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.sourceItemId === 'string' &&
    typeof value.sourceItemName === 'string' &&
    (value.kind === 'magicTicketSelect' || value.kind === 'choiceItem') &&
    Array.isArray(value.options) &&
    value.options.every(isValidPendingChoiceOption)
  );
};


const isValidStatusEffect = (value: unknown): value is StatusEffect => {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    (value.target === 'player' || value.target === 'enemy') &&
    isNumber(value.durationTurns) &&
    validStatusKinds.includes(value.kind as StatusEffect['kind']) &&
    (value.note === undefined || typeof value.note === 'string')
  );
};

const isValidHaloState = (value: unknown): value is HaloState => {
  if (!isObject(value) || !isObject(value.usedThisFloor)) {
    return false;
  }

  return (
    (value.selectedKind === undefined || validHaloKinds.includes(value.selectedKind as HaloKind)) &&
    Object.entries(value.usedThisFloor).every(([key, recordValue]) => validHaloKinds.includes(key as HaloKind) && typeof recordValue === 'boolean') &&
    (value.pendingAmplification === undefined ||
      (isObject(value.pendingAmplification) &&
        (value.pendingAmplification.actionId === undefined || typeof value.pendingAmplification.actionId === 'string') &&
        (value.pendingAmplification.description === undefined || typeof value.pendingAmplification.description === 'string'))) &&
    (value.pendingDesire === undefined ||
      (isObject(value.pendingDesire) && typeof value.pendingDesire.result === 'string' && isNumber(value.pendingDesire.actionDisabledTurns))) &&
    (value.satanActive === undefined || typeof value.satanActive === 'boolean') &&
    (value.haloIgnoresOpponentHalo === undefined || typeof value.haloIgnoresOpponentHalo === 'boolean') &&
    (value.haloIgnoresOpponentIbcheon === undefined || typeof value.haloIgnoresOpponentIbcheon === 'boolean') &&
    Array.isArray(value.observedSpells) &&
    value.observedSpells.every(isValidLearnedSpell) &&
    Array.isArray(value.history) &&
    value.history.every((entry) => typeof entry === 'string')
  );
};

const isValidMagicBookAttempt = (value: unknown): value is GameState['magicBookAttempt'] =>
  isObject(value) && isNumber(value.floor) && typeof value.freeUsed === 'boolean';

const isValidAngelTrial = (value: unknown): value is GameState['angelTrial'] =>
  isObject(value) &&
  Array.isArray(value.claimedScores) &&
  value.claimedScores.every(isNumber) &&
  (value.lastScore === undefined || isNumber(value.lastScore)) &&
  (value.lastResult === undefined || typeof value.lastResult === 'string');

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
    Array.isArray(value.skills) &&
    value.skills.every(isValidPlayerSkill) &&
    Array.isArray(value.techniqueSources) &&
    value.techniqueSources.every((source) => typeof source === 'string') &&
    Array.isArray(value.techniques) &&
    value.techniques.every(isValidPlayerTechnique) &&
    isValidEquipmentLoadout(value.equipment) &&
    Array.isArray(value.statuses) &&
    value.statuses.every(isValidStatusEffect) &&
    isValidHaloState(value.halo) &&
    isValidMagicBookAttempt(value.magicBookAttempt) &&
    isValidAngelTrial(value.angelTrial) &&
    (value.rewardState === undefined || isValidRewardState(value.rewardState)) &&
    (value.pendingReaction === undefined || isValidPendingReaction(value.pendingReaction)) &&
    (value.pendingChoice === undefined || isValidPendingChoice(value.pendingChoice))
  );
};

const refreshCharacterDerived = (character: Character, equipment?: EquipmentLoadout, effectiveStats?: CoreStats): Character => {
  const derived = calcDerivedStats(effectiveStats ?? character.stats);
  const refreshed = {
    ...character,
    derived,
    hp: Math.min(character.hp, derived.maxHP),
    mp: Math.min(character.mp, derived.maxMP)
  };

  return equipment ? applyEquipmentBonuses(refreshed, equipment) : refreshed;
};

const getEffectivePlayerStats = (state: GameState): CoreStats => {
  const passiveStats = applyPassiveSkillStats(state.player.stats, state.skills);
  return state.halo.selectedKind === 'satan' || state.halo.satanActive
    ? { ...passiveStats, strength: passiveStats.strength + 10, dexterity: passiveStats.dexterity + 10, constitution: passiveStats.constitution + 10 }
    : passiveStats;
};

const refreshDerivedStats = (state: GameState): GameState => ({
  ...state,
  player: refreshCharacterDerived(state.player, state.equipment, getEffectivePlayerStats(state)),
  enemy: refreshCharacterDerived(state.enemy)
});

export const saveGameStub = (state: GameState): string => {
  const payload: SavePayload = {
    saveVersion: SAVE_VERSION,
    state: refreshDerivedStats(state)
  };

  localStorage.setItem(SAVE_KEY, JSON.stringify(payload));

  return `저장: saveVersion ${SAVE_VERSION} 상태, 층, 보상, 인벤토리, 보유 마법, 스킬, 기술 제작 출처, 기술, 장비, 헤일로, 상태효과, 마법서 시도권, 천사의 시련을 localStorage에 기록했습니다.`;
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

export const clearSavedGame = (): string => {
  localStorage.removeItem(SAVE_KEY);
  LEGACY_SAVE_KEYS.forEach((key) => localStorage.removeItem(key));

  return '저장 데이터를 초기화했습니다.';
};
