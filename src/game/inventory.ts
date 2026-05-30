import { tryLearnMagicBook } from '../rules/spell';
import { appendLog, type GameState, type LearnedSpell, type RewardItem } from '../state/gameState';
import { refreshPlayer, updatePlayerStats } from './characterUpdate';

const maintenancePhases: GameState['phase'][] = ['reward-pending', 'level-up-pending', 'floor-cleared', 'battle-ended'];

const createId = (prefix: string): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? `${prefix}-${crypto.randomUUID()}` : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const isMaintenancePhase = (state: GameState): boolean => maintenancePhases.includes(state.phase);

const findInventoryItem = (state: GameState, itemId: string): RewardItem | undefined => state.inventory.find((item) => item.id === itemId);

const removeItemWithoutLog = (state: GameState, itemId: string): GameState => ({
  ...state,
  inventory: state.inventory.filter((item) => item.id !== itemId)
});

const isOuterStackItem = (item: RewardItem): boolean => item.name === '외공서' || item.name === 'Outer Stack Manual';
const isInnerStackItem = (item: RewardItem): boolean => item.name === '내공서' || item.name === 'Inner Stack Manual';
const isSwordKiItem = (item: RewardItem): boolean => item.name === '검기' || item.name === 'Sword Ki Manual';
const isMulticastingItem = (item: RewardItem): boolean => item.name === '멀티캐스팅의 서' || item.name === 'Multicasting Manual';

export const removeInventoryItem = (state: GameState, itemId: string): GameState => {
  const item = findInventoryItem(state, itemId);

  if (!item) {
    return appendLog(state, '인벤토리에서 해당 아이템을 찾을 수 없습니다.');
  }

  return appendLog(removeItemWithoutLog(state, itemId), `${item.name}을(를) 인벤토리에서 제거했습니다.`);
};

export const useInventoryItem = (state: GameState, itemId: string): GameState => {
  if (!isMaintenancePhase(state)) {
    return appendLog(state, '인벤토리 아이템은 정비 단계에서만 사용할 수 있습니다.');
  }

  const item = findInventoryItem(state, itemId);

  if (!item) {
    return appendLog(state, '인벤토리에서 해당 아이템을 찾을 수 없습니다.');
  }

  if (isOuterStackItem(item)) {
    const updated = updatePlayerStats(removeItemWithoutLog(state, itemId), (stats) => ({ ...stats, outerStack: stats.outerStack + 1 }));
    return appendLog(updated, '외공서 사용: 외공이 1 증가했습니다.');
  }

  if (isInnerStackItem(item)) {
    const updated = updatePlayerStats(removeItemWithoutLog(state, itemId), (stats) => ({ ...stats, innerStack: stats.innerStack + 1 }));
    return appendLog(updated, '내공서 사용: 내공이 1 증가했습니다.');
  }

  if (isSwordKiItem(item)) {
    if (state.player.stats.swordKi >= 6) {
      return appendLog(state, '검기 사용 불가: 검기 단계는 이미 최대 6입니다.');
    }

    const updated = updatePlayerStats(removeItemWithoutLog(state, itemId), (stats) => ({
      ...stats,
      swordKi: (stats.swordKi + 1) as typeof stats.swordKi
    }));
    return appendLog(updated, '검기 사용: 검기 단계가 상승했습니다.');
  }

  if (isMulticastingItem(item)) {
    const updated = updatePlayerStats(removeItemWithoutLog(state, itemId), (stats) => ({ ...stats, multicasting: stats.multicasting + 1 }));
    return appendLog(updated, '멀티캐스팅의 서 사용: 멀티캐스팅이 1 증가했습니다.');
  }

  if (item.type === 'magicBook') {
    const result = tryLearnMagicBook(state.player.stats.wisdom, item.grade ?? '기초');

    if (!result.success || !result.spell) {
      return appendLog(state, `${result.message} 다시 시도할 수 있습니다.`);
    }

    const learnedSpell: LearnedSpell = {
      id: createId('spell'),
      name: result.spell.name,
      circle: result.spell.circle,
      grade: result.spell.grade,
      sourceItemName: item.name
    };

    return appendLog(
      {
        ...removeItemWithoutLog(state, itemId),
        spells: [...state.spells, learnedSpell]
      },
      `마법서 사용: ${result.message}`
    );
  }

  if (item.type === 'reset') {
    return appendLog(state, '스킬 시스템 구현 후 사용할 수 있습니다.');
  }

  return appendLog(state, '이 아이템의 사용 효과는 아직 구현되지 않았습니다.');
};

export const canUseItemInBattle = (item: RewardItem): boolean =>
  item.type === 'item' && item.mode === 'select' && item.learnedSpellName === 'combat-usable';

export const getBattleUsableItems = (state: GameState): RewardItem[] => state.inventory.filter(canUseItemInBattle);

export const useBattleInventoryItem = (state: GameState, itemId: string): GameState => {
  if (state.phase !== 'player-main') {
    return appendLog(state, 'Battle items can only be queued from the player main phase.');
  }

  const item = findInventoryItem(state, itemId);

  if (!item) {
    return appendLog(state, 'Use item failed: the selected inventory item was not found.');
  }

  if (!canUseItemInBattle(item)) {
    return appendLog(state, `${item.name} cannot be used during battle. TODO: no source combat-use effect is defined for this item.`);
  }

  return appendLog(state, `${item.name} has no implemented battle effect yet. TODO: wire source-defined combat consumables only.`);
};

export const sellInventoryItem = (state: GameState, itemId: string): GameState => {
  if (!isMaintenancePhase(state)) {
    return appendLog(state, '인벤토리 아이템은 정비 단계에서만 판매할 수 있습니다.');
  }

  const item = findInventoryItem(state, itemId);

  if (!item) {
    return appendLog(state, '인벤토리에서 해당 아이템을 찾을 수 없습니다.');
  }

  const sell = item.sell ?? 0;

  if (sell <= 0) {
    return appendLog(state, `${item.name} 판매 불가: 판매가가 없습니다.`);
  }

  const updated = refreshPlayer({
    ...removeItemWithoutLog(state, itemId),
    player: {
      ...state.player,
      stats: {
        ...state.player.stats,
        coin: state.player.stats.coin + sell
      }
    }
  });

  return appendLog(updated, `${item.name} 판매: ${sell}코인을 획득했습니다.`);
};
