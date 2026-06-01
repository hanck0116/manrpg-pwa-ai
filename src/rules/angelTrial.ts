import { makeItem } from './reward';
import type { RewardItem } from '../state/gameState';

export type AngelReward = {
  score: number;
  name: string;
  type: 'coin' | 'trait' | 'choice' | 'item' | 'multiItem';
  coin?: number;
  choices?: string[];
  itemName?: string;
  count?: number;
};

export const ANGEL_TABLE: AngelReward[] = [
  { score: 1000000, name: '헤일로/입천 선택권', type: 'choice', choices: ['헤일로', '입천'] },
  { score: 750000, name: '정령왕', type: 'trait' },
  { score: 500000, name: '금강불괴의 정신', type: 'trait' },
  { score: 400000, name: '원영', type: 'trait' },
  { score: 300000, name: '상급 정령/빙백연혼 선택권', type: 'choice', choices: ['상급 정령', '빙백연혼'] },
  { score: 200000, name: '중급 정령/흑염의 영체화 선택권', type: 'choice', choices: ['중급 정령', '흑염의 영체화'] },
  { score: 100000, name: '심/신적초월 선택권', type: 'choice', choices: ['심적초월', '신적초월'] },
  { score: 75000, name: '정령/연혼염 선택권', type: 'choice', choices: ['하급 정령', '연혼염'] },
  { score: 50000, name: '변이 선택권', type: 'choice', choices: ['자기상환적 돌연변이', '삼매경', '접기'] },
  { score: 25000, name: '유물', type: 'item' },
  { score: 10000, name: '임모탈 평선', type: 'trait' },
  { score: 9000, name: '오리지널 스킬', type: 'item' },
  { score: 7000, name: '심법', type: 'trait' },
  { score: 5000, name: '극기', type: 'trait' },
  { score: 4000, name: '시분할/50코인 선택권', type: 'choice', choices: ['시분할', '50코인'] },
  { score: 3000, name: '공법', type: 'item' },
  { score: 2000, name: '묘리 선택권', type: 'choice', choices: ['모델링', '스키마'] },
  { score: 1000, name: '검기 2권', type: 'multiItem', itemName: '검기', count: 2 },
  { score: 500, name: '고급 마법서 뽑기권', type: 'item' },
  { score: 300, name: '멀티캐스팅 2권', type: 'multiItem', itemName: '멀티캐스팅의 서', count: 2 },
  { score: 200, name: '중급 마법서 선택권', type: 'item' },
  { score: 100, name: '기초 마법서 선택권', type: 'item' },
  { score: 80, name: '멀티캐스팅의 서', type: 'item' },
  { score: 60, name: '외공서/내공서 선택권', type: 'choice', choices: ['외공서', '내공서'] },
  { score: 40, name: '중급 마법서 뽑기권', type: 'item' },
  { score: 30, name: '기초 마법서 뽑기권', type: 'item' },
  { score: 20, name: '3코인', type: 'coin', coin: 3 },
  { score: 10, name: '1코인', type: 'coin', coin: 1 }
];

const ascendingRewards = (): AngelReward[] => [...ANGEL_TABLE].sort((a, b) => a.score - b.score);

export const getAngelRewards = (score: number): AngelReward[] => ascendingRewards().filter((reward) => score >= reward.score);

export const getUnclaimedAngelRewards = (score: number, claimedScores: number[]): AngelReward[] => {
  const claimed = new Set(claimedScores.map(Number));
  return getAngelRewards(score).filter((reward) => !claimed.has(reward.score));
};

export const angelRewardToRewardItem = (reward: AngelReward): RewardItem | RewardItem[] | { coin: number } => {
  if (reward.type === 'coin') return { coin: reward.coin ?? 0 };
  if (reward.type === 'trait') return { ...makeItem(reward.name), type: 'trait' };
  if (reward.type === 'choice') return { ...makeItem(reward.name), type: 'choice', choices: reward.choices ?? [] };
  if (reward.type === 'multiItem') {
    return Array.from({ length: reward.count ?? 0 }, () => makeItem(reward.itemName ?? reward.name));
  }

  return makeItem(reward.name);
};

export const getAngelTrialSummary = (score: number, claimedScores: number[]): string => {
  const rewards = getAngelRewards(score);
  const unclaimed = getUnclaimedAngelRewards(score, claimedScores);

  if (rewards.length === 0) return `시련값 ${score}: 보상 없음`;
  if (unclaimed.length === 0) return `시련값 ${score}: 신규 보상 없음`;

  return `시련값 ${score}: 신규 보상 ${unclaimed.length}개 (${unclaimed.map((reward) => `${reward.score}:${reward.name}`).join(', ')})`;
};
