import { appendLog, type GameState, type RewardItem } from '../state/gameState';
import { refreshPlayer } from '../game/characterUpdate';

export type ShopItem = {
  id: string;
  name: string;
  type: RewardItem['type'] | 'relic';
  price: number;
  grade?: string;
  description: string;
};

const createId = (prefix: string): string => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const SHOP_BUY_LIST: ShopItem[] = [
  { id: 'relic-grade-1', name: 'Relic grade +1', type: 'relic', price: 2, description: 'TODO: relic reward system is not implemented yet.' },
  { id: 'magic-basic', name: 'Basic Magic Book', type: 'magicBook', price: 3, grade: '기초', description: 'Learn chance for a 1-2 circle spell.' },
  { id: 'magic-mid', name: 'Intermediate Magic Book', type: 'magicBook', price: 9, grade: '중급', description: 'Learn chance for a 3-4 circle spell.' },
  { id: 'magic-high', name: 'Advanced Magic Book', type: 'magicBook', price: 27, grade: '고급', description: 'Learn chance for a 5-6 circle spell.' },
  { id: 'multi-book', name: 'Multicasting Manual', type: 'multi', price: 12, description: 'Raises multicasting by 1 when used during maintenance.' },
  { id: 'outer-book', name: 'Outer Stack Manual', type: 'martial', price: 10, description: 'Raises outer stack by 1 when used during maintenance.' },
  { id: 'inner-book', name: 'Inner Stack Manual', type: 'martial', price: 10, description: 'Raises inner stack by 1 when used during maintenance.' },
  { id: 'sword-ki', name: 'Sword Ki Manual', type: 'martial', price: 30, description: 'Raises sword ki by 1, up to 6, when used during maintenance.' },
  { id: 'magic-draw-ticket', name: 'Magic Book Draw Ticket', type: 'magicBook', price: 15, grade: '기초', description: 'TODO: source draw-ticket effect is not mapped; stored as a basic magic book for now.' },
  { id: 'skill-reset', name: 'Skill Reset Token', type: 'reset', price: 10, description: 'TODO: skill system/reset effect is not implemented yet.' }
];

const maintenanceShopPhases: GameState['phase'][] = ['floor-cleared', 'reward-pending', 'level-up-pending', 'battle-ended'];

export const getShopItems = (): ShopItem[] => SHOP_BUY_LIST;

export const canBuyShopItem = (state: GameState, shopItemId: string): boolean => {
  const item = SHOP_BUY_LIST.find((shopItem) => shopItem.id === shopItemId);

  return Boolean(item) && maintenanceShopPhases.includes(state.phase) && state.player.stats.coin >= (item?.price ?? Infinity);
};

const toRewardItem = (shopItem: ShopItem): RewardItem => ({
  id: createId(`shop-${shopItem.id}`),
  name: shopItem.name,
  type: shopItem.type === 'relic' ? 'item' : shopItem.type,
  grade: shopItem.grade,
  sell:
    shopItem.id === 'magic-basic'
      ? 1
      : shopItem.id === 'magic-mid'
        ? 5
        : shopItem.id === 'magic-high'
          ? 9
          : shopItem.id === 'multi-book'
            ? 4
            : shopItem.id === 'outer-book' || shopItem.id === 'inner-book'
              ? 5
              : shopItem.id === 'sword-ki'
                ? 12
                : shopItem.id === 'skill-reset'
                  ? 5
                  : 0
});

export const buyShopItem = (state: GameState, shopItemId: string): GameState => {
  if (!maintenanceShopPhases.includes(state.phase)) {
    return appendLog(state, 'Shop is only available during maintenance phases, not during battle.');
  }

  const shopItem = SHOP_BUY_LIST.find((item) => item.id === shopItemId);

  if (!shopItem) {
    return appendLog(state, 'Shop purchase failed: item not found.');
  }

  if (state.player.stats.coin < shopItem.price) {
    return appendLog(state, `Shop purchase failed: ${shopItem.name} costs ${shopItem.price} coin.`);
  }

  const updated = refreshPlayer({
    ...state,
    player: {
      ...state.player,
      stats: {
        ...state.player.stats,
        coin: state.player.stats.coin - shopItem.price
      }
    },
    inventory: [...state.inventory, toRewardItem(shopItem)]
  });

  const todoNote = shopItem.type === 'relic' || shopItem.id === 'magic-draw-ticket' || shopItem.id === 'skill-reset' ? ` ${shopItem.description}` : '';

  return appendLog(updated, `Bought ${shopItem.name} for ${shopItem.price} coin.${todoNote}`);
};
