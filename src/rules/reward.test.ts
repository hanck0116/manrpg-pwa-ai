import { describe, expect, it } from 'vitest';
import { getRewardConfig, makeItem } from './reward';

describe('rewardConfig', () => {
  it('uses appearance to determine offer and pick counts', () => {
    expect(getRewardConfig(1)).toEqual({ offer: 2, pick: 1 });
    expect(getRewardConfig(50)).toEqual({ offer: 7, pick: 2 });
    expect(getRewardConfig(100)).toEqual({ offer: 10, pick: 5 });
  });
});

describe('makeItem extended reward types', () => {
  it('creates a random basic magic ticket', () => {
    expect(makeItem('기초 마법서 뽑기권')).toMatchObject({
      name: '기초 마법서 뽑기권',
      type: 'magicTicket',
      grade: '기초',
      mode: 'random',
      sell: 3
    });
  });

  it('creates a selectable basic magic ticket', () => {
    expect(makeItem('기초 마법서 선택권')).toMatchObject({
      name: '기초 마법서 선택권',
      type: 'magicTicket',
      grade: '기초',
      mode: 'select',
      sell: 5
    });
  });

  it('creates a generic choice ticket without inventing choices', () => {
    expect(makeItem('아무 선택권')).toMatchObject({
      name: '아무 선택권',
      type: 'choice',
      sell: 0
    });
  });
});
