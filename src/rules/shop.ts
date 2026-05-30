import { refreshPlayer } from '../game/characterUpdate';
import { appendLog, type GameState, type RewardItem } from '../state/gameState';
import { makeItem } from './reward';

export type ShopItem = {
  id: string;
  name: string;
  type: RewardItem['type'];
  price: number;
  grade?: string;
  description: string;
};

export const SHOP_BUY_LIST: ShopItem[] = [
  { id: 'magic-basic', name: '기초 마법서', type: 'magicBook', price: 3, grade: '기초', description: '1~2서클 마법 습득 판정을 진행합니다.' },
  { id: 'magic-mid', name: '중급 마법서', type: 'magicBook', price: 9, grade: '중급', description: '3~4서클 마법 습득 판정을 진행합니다.' },
  { id: 'magic-high', name: '고급 마법서', type: 'magicBook', price: 27, grade: '고급', description: '5~6서클 마법 습득 판정을 진행합니다.' },
  { id: 'multi-book', name: '멀티캐스팅의 서', type: 'multi', price: 12, description: '정비 단계에서 사용하면 멀티캐스팅이 1 증가합니다.' },
  { id: 'outer-book', name: '외공서', type: 'martial', price: 10, description: '정비 단계에서 사용하면 외공이 1 증가합니다.' },
  { id: 'inner-book', name: '내공서', type: 'martial', price: 10, description: '정비 단계에서 사용하면 내공이 1 증가합니다.' },
  { id: 'sword-ki', name: '검기', type: 'martial', price: 30, description: '정비 단계에서 사용하면 검기가 1 증가합니다. 최대 6단계입니다.' },
  { id: 'magic-draw-ticket', name: '기초 마법서 뽑기권', type: 'magicTicket', price: 15, grade: '기초', description: '사용하면 기초 등급 범위의 마법 1개를 즉시 획득합니다.' },
  { id: 'skill-reset', name: '스킬 초기화권', type: 'reset', price: 10, description: '스킬 초기화 효과는 다음 단계에서 구현 예정입니다.' }
];

const maintenanceShopPhases: GameState['phase'][] = ['floor-cleared', 'reward-pending', 'level-up-pending', 'battle-ended'];

export const getShopItems = (): ShopItem[] => SHOP_BUY_LIST;

export const canBuyShopItem = (state: GameState, shopItemId: string): boolean => {
  const item = SHOP_BUY_LIST.find((shopItem) => shopItem.id === shopItemId);

  return Boolean(item) && maintenanceShopPhases.includes(state.phase) && state.player.stats.coin >= (item?.price ?? Infinity);
};

const toRewardItem = (shopItem: ShopItem): RewardItem => {
  return makeItem(shopItem.name);
};

export const buyShopItem = (state: GameState, shopItemId: string): GameState => {
  if (!maintenanceShopPhases.includes(state.phase)) {
    return appendLog(state, '상점은 정비 단계에서만 이용할 수 있습니다.');
  }

  const shopItem = SHOP_BUY_LIST.find((item) => item.id === shopItemId);

  if (!shopItem) {
    return appendLog(state, '구매 실패: 해당 상품을 찾을 수 없습니다.');
  }

  if (state.player.stats.coin < shopItem.price) {
    return appendLog(state, `구매 실패: ${shopItem.name}의 가격은 ${shopItem.price}코인입니다.`);
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

  const todoNote = shopItem.id === 'skill-reset' ? ` ${shopItem.description}` : '';

  return appendLog(updated, `${shopItem.name} 구매: ${shopItem.price}코인을 사용했습니다.${todoNote}`);
};
