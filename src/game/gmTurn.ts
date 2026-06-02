import { appendLog, type GameState, type RewardItem } from '../state/gameState';

export type EnemyPublicHint = {
  distanceHint: string;
  threatHint: string;
  conditionHint: string;
};

export type GmTurnPayload = {
  scene: {
    floor: number;
    phase: string;
    shortSummary: string;
    recentEvents: string[];
  };
  player: {
    hp: number;
    maxHP: number;
    mp: number;
    maxMP: number;
    level: number;
    attack: number;
    position: { x: number; y: number };
    equipped: string[];
    availableActions: string[];
    notableTraits: string[];
  };
  hiddenEnemy: {
    visibility: 'hidden';
    distanceHint: string;
    threatHint: string;
    conditionHint: string;
  };
  playerInput: string;
  rules: {
    playerCount: 1;
    enemyCount: 1;
    noBoss: true;
    fixedMap: '11x11';
    doNotInventOriginalEffects: true;
  };
};

export type GmTurnResponse = {
  narration: string;
  playerActionResult: {
    kind: 'attack' | 'defend' | 'move' | 'skill' | 'spell' | 'item' | 'talk' | 'inspect' | 'other';
    successLevel: 'fail' | 'partial' | 'success' | 'great';
    summary: string;
  };
  enemyAction: {
    kind: 'attack' | 'move' | 'guard' | 'special' | 'wait';
    summary: string;
  };
  stateDeltas: {
    playerHpDelta: number;
    playerMpDelta: number;
    enemyHpDelta: number;
    coinDelta: number;
    usedItemIds: string[];
    gainedItemNames: string[];
  };
  nextChoices: string[];
  summaryUpdate: string;
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const finiteDelta = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : 0);
const shortText = (value: unknown, max: number): string => (typeof value === 'string' ? value.slice(0, max) : '');
const stringArray = (value: unknown, maxItems: number, maxChars: number): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string').slice(0, maxItems).map((entry) => entry.slice(0, maxChars)) : [];

export const trimSceneSummary = (summary: string): string => summary.slice(0, 300);

export const getEnemyPublicHint = (state: GameState): EnemyPublicHint => {
  const dx = state.enemy.position.x - state.player.position.x;
  const dy = state.enemy.position.y - state.player.position.y;
  const distance = Math.abs(dx) + Math.abs(dy);
  const hpRatio = state.enemy.derived.maxHP > 0 ? state.enemy.hp / state.enemy.derived.maxHP : 0;

  return {
    distanceHint: distance <= 1 ? '바로 근처에서 기척이 느껴진다.' : distance <= 3 ? '몇 걸음 안쪽에서 움직임이 느껴진다.' : '멀리서 희미한 기척만 감지된다.',
    threatHint: state.enemy.derived.attack >= state.player.derived.attack ? '위협도는 높아 보인다.' : '위협도는 낮거나 비슷해 보인다.',
    conditionHint: hpRatio <= 0.25 ? '상대의 기세가 크게 흔들린다.' : hpRatio <= 0.6 ? '상대의 호흡이 조금 거칠다.' : '상대의 기세는 아직 흐트러지지 않았다.'
  };
};

const equippedNames = (state: GameState): string[] =>
  (['weapon', 'armor', 'accessory'] as const).map((slot) => state.equipment[slot]?.name).filter((name): name is string => Boolean(name));

const availableActions = (state: GameState): string[] => {
  const actions = ['자연어 행동', '이동', '방어', '관찰'];
  const coreItems = state.inventory
    .filter((item) => item.type === 'item' || item.type === 'special' || item.type === 'magicTicket' || item.type === 'choice')
    .slice(0, 5)
    .map((item) => `핵심 아이템:${item.name}`);

  if (state.player.hp > 0 && state.enemy.hp > 0) actions.push('공격');
  if (state.skills.some((skill) => skill.timing === 'main')) actions.push('스킬');
  if (state.spells.length > 0) actions.push('마법');
  actions.push(...coreItems);
  return actions.slice(0, 12);
};

export const buildGmTurnPayload = (state: GameState, playerInput: string): GmTurnPayload => {
  const hint = state.hiddenEnemyHint ?? getEnemyPublicHint(state);

  return {
    scene: {
      floor: state.floor,
      phase: state.phase,
      shortSummary: trimSceneSummary(state.sceneSummary),
      recentEvents: state.recentEvents.slice(-5)
    },
    player: {
      hp: state.player.hp,
      maxHP: state.player.derived.maxHP,
      mp: state.player.mp,
      maxMP: state.player.derived.maxMP,
      level: state.player.stats.level,
      attack: state.player.derived.attack,
      position: state.player.position,
      equipped: equippedNames(state),
      availableActions: availableActions(state),
      notableTraits: state.player.stats.traits.slice(0, 5)
    },
    hiddenEnemy: {
      visibility: 'hidden',
      distanceHint: hint.distanceHint,
      threatHint: hint.threatHint,
      conditionHint: hint.conditionHint
    },
    playerInput: playerInput.slice(0, 300),
    rules: {
      playerCount: 1,
      enemyCount: 1,
      noBoss: true,
      fixedMap: '11x11',
      doNotInventOriginalEffects: true
    }
  };
};

const removeUsedItems = (inventory: RewardItem[], usedItemIds: string[]): RewardItem[] => {
  const used = new Set(usedItemIds);
  return inventory.filter((item) => !used.has(item.id));
};

const addGainedItems = (inventory: RewardItem[], names: string[], turn: number): RewardItem[] => [
  ...inventory,
  ...names.slice(0, 3).map((name, index): RewardItem => ({
    id: `gm-item-${turn}-${index}-${name}`,
    name,
    type: 'item',
    sell: 0
  }))
];

export const normalizeGmTurnResponse = (value: unknown): GmTurnResponse => {
  const record = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  const deltas = typeof record.stateDeltas === 'object' && record.stateDeltas !== null ? (record.stateDeltas as Record<string, unknown>) : {};
  const playerAction = typeof record.playerActionResult === 'object' && record.playerActionResult !== null ? (record.playerActionResult as Record<string, unknown>) : {};
  const enemyAction = typeof record.enemyAction === 'object' && record.enemyAction !== null ? (record.enemyAction as Record<string, unknown>) : {};

  return {
    narration: shortText(record.narration, 1000) || 'GM 응답이 비어 있어 장면 변화가 조용히 지나갑니다.',
    playerActionResult: {
      kind: ['attack', 'defend', 'move', 'skill', 'spell', 'item', 'talk', 'inspect', 'other'].includes(String(playerAction.kind)) ? (playerAction.kind as GmTurnResponse['playerActionResult']['kind']) : 'other',
      successLevel: ['fail', 'partial', 'success', 'great'].includes(String(playerAction.successLevel)) ? (playerAction.successLevel as GmTurnResponse['playerActionResult']['successLevel']) : 'partial',
      summary: shortText(playerAction.summary, 200)
    },
    enemyAction: {
      kind: ['attack', 'move', 'guard', 'special', 'wait'].includes(String(enemyAction.kind)) ? (enemyAction.kind as GmTurnResponse['enemyAction']['kind']) : 'wait',
      summary: shortText(enemyAction.summary, 200)
    },
    stateDeltas: {
      playerHpDelta: finiteDelta(deltas.playerHpDelta),
      playerMpDelta: finiteDelta(deltas.playerMpDelta),
      enemyHpDelta: finiteDelta(deltas.enemyHpDelta),
      coinDelta: finiteDelta(deltas.coinDelta),
      usedItemIds: stringArray(deltas.usedItemIds, 5, 80),
      gainedItemNames: stringArray(deltas.gainedItemNames, 3, 80)
    },
    nextChoices: stringArray(record.nextChoices, 3, 80),
    summaryUpdate: trimSceneSummary(shortText(record.summaryUpdate, 300))
  };
};

export const applyGmTurnResponse = (state: GameState, responseValue: unknown): GameState => {
  const response = normalizeGmTurnResponse(responseValue);
  const deltas = response.stateDeltas;
  const nextPlayerHp = clamp(state.player.hp + deltas.playerHpDelta, 0, state.player.derived.maxHP);
  const nextPlayerMp = clamp(state.player.mp + deltas.playerMpDelta, 0, state.player.derived.maxMP);
  const nextEnemyHp = clamp(state.enemy.hp + deltas.enemyHpDelta, 0, state.enemy.derived.maxHP);
  const nextCoin = Math.max(0, state.player.stats.coin + deltas.coinDelta);
  const afterItems = addGainedItems(removeUsedItems(state.inventory, deltas.usedItemIds), deltas.gainedItemNames, state.turn);
  const resultLine = response.playerActionResult.summary ? `행동 결과: ${response.playerActionResult.summary}` : `행동 결과: ${response.playerActionResult.successLevel}`;
  const enemyLine = response.enemyAction.summary ? `적 행동: ${response.enemyAction.summary}` : `적 행동: ${response.enemyAction.kind}`;
  const events = [resultLine, enemyLine, response.narration].filter(Boolean).slice(-5);
  const nextBase: GameState = {
    ...state,
    player: {
      ...state.player,
      hp: nextPlayerHp,
      mp: nextPlayerMp,
      stats: { ...state.player.stats, coin: nextCoin }
    },
    enemy: { ...state.enemy, hp: nextEnemyHp },
    inventory: afterItems,
    sceneSummary: response.summaryUpdate || trimSceneSummary(state.sceneSummary),
    recentEvents: [...state.recentEvents, ...events].slice(-5),
    nextChoices: response.nextChoices.length > 0 ? response.nextChoices : state.nextChoices,
    hiddenEnemyHint: getEnemyPublicHint({ ...state, enemy: { ...state.enemy, hp: nextEnemyHp } }),
    lastPlayerInput: state.pendingPlayerInput || state.lastPlayerInput,
    pendingPlayerInput: undefined,
    gmTurnCount: state.gmTurnCount + 1,
    turn: state.turn + 1,
    phase: nextPlayerHp <= 0 ? 'battle-ended' : nextEnemyHp <= 0 ? 'floor-cleared' : 'player-main'
  };

  return appendLog(appendLog(appendLog(nextBase, response.narration), resultLine), enemyLine);
};
