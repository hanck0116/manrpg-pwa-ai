import { describe, expect, it } from 'vitest';
import { angelRewardToRewardItem, getAngelRewards, getUnclaimedAngelRewards } from './angelTrial';

describe('angelTrial rules', () => {
  it('returns rewards at or below score in ascending score order', () => {
    expect(getAngelRewards(40).map((reward) => reward.score)).toEqual([10, 20, 30, 40]);
  });

  it('excludes rewards already present in claimedScores', () => {
    expect(getUnclaimedAngelRewards(40, [10, 30]).map((reward) => reward.score)).toEqual([20, 40]);
  });

  it('converts multiItem rewards into count item instances', () => {
    const converted = angelRewardToRewardItem({ score: 1000, name: '검기 2권', type: 'multiItem', itemName: '검기', count: 2 });

    expect(Array.isArray(converted)).toBe(true);
    expect(Array.isArray(converted) ? converted.map((item) => item.name) : []).toEqual(['검기', '검기']);
  });

  it('converts coin rewards into immediate coin payloads', () => {
    expect(angelRewardToRewardItem({ score: 20, name: '3코인', type: 'coin', coin: 3 })).toEqual({ coin: 3 });
  });

  it('converts choice rewards into RewardItem type choice', () => {
    const converted = angelRewardToRewardItem({ score: 60, name: '외공서/내공서 선택권', type: 'choice', choices: ['외공서', '내공서'] });

    expect(Array.isArray(converted)).toBe(false);
    expect('type' in converted ? converted.type : '').toBe('choice');
    expect('choices' in converted ? converted.choices : []).toEqual(['외공서', '내공서']);
  });
});
