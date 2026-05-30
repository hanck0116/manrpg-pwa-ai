import { describe, expect, it } from 'vitest';
import { getRewardConfig } from './reward';

describe('rewardConfig', () => {
  it('uses appearance to determine offer and pick counts', () => {
    expect(getRewardConfig(1)).toEqual({ offer: 2, pick: 1 });
    expect(getRewardConfig(50)).toEqual({ offer: 7, pick: 2 });
    expect(getRewardConfig(100)).toEqual({ offer: 10, pick: 5 });
  });
});
