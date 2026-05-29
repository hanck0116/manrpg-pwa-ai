import type { RewardItem, RewardState } from '../state/gameState';

export type RewardConfig = {
  offer: number;
  pick: number;
};

export type RewardResult = {
  gold: number;
  items: string[];
  message: string;
};

export const getRewardConfig = (appearance: number): RewardConfig => {
  const safeAppearance = Math.floor(appearance);

  if (safeAppearance >= 100) return { offer: 10, pick: 5 };
  if (safeAppearance >= 90) return { offer: 10, pick: 4 };
  if (safeAppearance >= 80) return { offer: 10, pick: 3 };
  if (safeAppearance >= 70) return { offer: 9, pick: 3 };
  if (safeAppearance >= 60) return { offer: 8, pick: 3 };
  if (safeAppearance >= 50) return { offer: 7, pick: 2 };
  if (safeAppearance >= 40) return { offer: 6, pick: 2 };
  if (safeAppearance >= 30) return { offer: 5, pick: 2 };
  if (safeAppearance >= 20) return { offer: 4, pick: 1 };
  if (safeAppearance >= 10) return { offer: 3, pick: 1 };

  return { offer: 2, pick: 1 };
};

export const weightedPick = <T>(items: { value: T; rate: number }[]): T => {
  const totalRate = items.reduce((sum, item) => sum + item.rate, 0);
  const roll = Math.random() * totalRate;
  let cursor = 0;

  for (const item of items) {
    cursor += item.rate;
    if (roll < cursor) {
      return item.value;
    }
  }

  return items[items.length - 1].value;
};

const withRewardId = (item: Omit<RewardItem, 'id'>, prefix = 'reward'): RewardItem => ({
  ...item,
  id: `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
});

export const makeItem = (name: string): RewardItem => {
  if (name === '외공서') return withRewardId({ name: '외공서', type: 'martial', sell: 5 }, 'martial');
  if (name === '내공서') return withRewardId({ name: '내공서', type: 'martial', sell: 5 }, 'martial');
  if (name === '검기') return withRewardId({ name: '검기', type: 'martial', sell: 12 }, 'martial');
  if (name === '멀티캐스팅의 서') return withRewardId({ name: '멀티캐스팅의 서', type: 'multi', sell: 10 }, 'multi');
  if (name === '스킬 초기화권') return withRewardId({ name: '스킬 초기화권', type: 'reset', sell: 5 }, 'reset');
  if (name === '기초 마법서') return withRewardId({ name: '기초 마법서', type: 'magicBook', grade: '기초', sell: 3 }, 'magic');
  if (name === '중급 마법서') return withRewardId({ name: '중급 마법서', type: 'magicBook', grade: '중급', sell: 5 }, 'magic');
  if (name === '고급 마법서') return withRewardId({ name: '고급 마법서', type: 'magicBook', grade: '고급', sell: 8 }, 'magic');
  if (name === '마도서') return withRewardId({ name: '마도서', type: 'magicBook', grade: '마도서', sell: 15 }, 'magic');

  const traitNames = [
    '모델링',
    '스키마',
    '스키마: 회복력 강화',
    '스키마: 근력 강화',
    '스키마: 속도강화',
    '시분할',
    '극기',
    '심법',
    '임모탈 평선',
    '유물',
    '하급 정령',
    '연혼염',
    '자기상환적 돌연변이',
    '삼매경',
    '접기',
    '신적초월',
    '심적초월',
    '중급 정령',
    '흑염의 영체화',
    '상급 정령',
    '빙백연혼',
    '원영',
    '금강불괴의 정신',
    '정령왕',
    '헤일로',
    '입천',
    '앙케 라'
  ];

  if (traitNames.includes(name)) return withRewardId({ name, type: 'trait', sell: 0 }, 'trait');
  if (name === '공법' || name === '오리지널 스킬' || name === '무공') return withRewardId({ name, type: 'special', sell: 0 }, 'special');

  return withRewardId({ name, type: 'item', sell: 0 }, 'item');
};

export const rollMartialBook = (): RewardItem => {
  const name = weightedPick([
    { value: '외공서', rate: 40 },
    { value: '내공서', rate: 40 },
    { value: '검기', rate: 20 }
  ]);

  return makeItem(name);
};

export const rollMagicBookGrade = (): RewardItem => {
  const name = weightedPick([
    { value: '기초 마법서', rate: 50 },
    { value: '중급 마법서', rate: 30 },
    { value: '고급 마법서', rate: 10 },
    { value: '멀티캐스팅의 서', rate: 9 },
    { value: '마도서', rate: 1 }
  ]);

  return makeItem(name);
};

export const rollReward = (): RewardItem => {
  const name = weightedPick([
    { value: '스킬 초기화권', rate: 5 },
    { value: '무공서', rate: 10 },
    { value: '마법서', rate: 25 },
    { value: '추가 코인 +1', rate: 40 },
    { value: '추가 코인 +2', rate: 20 }
  ]);

  if (name === '무공서') return rollMartialBook();
  if (name === '마법서') return rollMagicBookGrade();
  if (name === '추가 코인 +1') return withRewardId({ name: '추가 코인 +1', type: 'coin', coin: 1 }, 'coin');
  if (name === '추가 코인 +2') return withRewardId({ name: '추가 코인 +2', type: 'coin', coin: 2 }, 'coin');

  return makeItem(name);
};

export const generateRewardOffer = (appearance: number): RewardState => {
  const config = getRewardConfig(appearance);

  return {
    offered: Array.from({ length: config.offer }, () => rollReward()),
    selectedIds: [],
    offerCount: config.offer,
    pickCount: config.pick,
    claimed: false
  };
};

export const calculateRewardStub = (): RewardResult => ({
  gold: 0,
  items: [],
  message: '보상 후보 생성과 선택 UI는 외모 기반 offer/pick 및 최종 보상 풀로 로컬 구현되어 있습니다.'
});
