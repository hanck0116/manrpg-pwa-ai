import { describe, expect, it } from 'vitest';
import { describeSpell, spellManaCost, spellPower, spellRangeText } from './spell';

describe('마법 계산', () => {
  it('MP 소모량은 양수입니다', () => {
    expect(spellManaCost(1, 'single')).toBeGreaterThan(0);
    expect(spellManaCost(9, 'area')).toBeGreaterThan(0);
  });

  it('위력은 기준 MP를 넘지 않습니다', () => {
    expect(spellPower(50, 1, 'singleHigh')).toBeLessThanOrEqual(50);
    expect(spellPower(900, 9, 'area')).toBeLessThanOrEqual(900);
  });

  it('원본 목록 기반으로 마법 범주를 분류합니다', () => {
    expect(describeSpell('힐', 2).category).toBe('heal');
    expect(describeSpell('쉴드', 2).category).toBe('defense');
    expect(describeSpell('파이어 볼', 3).category).toBe('smallArea');
    expect(describeSpell('메테오 스트라이크', 9).category).toBe('singleHigh');
    expect(describeSpell('파이어 애로우', 2).category).toBe('single');
  });

  it('범위 문구를 한국어로 반환합니다', () => {
    expect(spellRangeText('single')).toBe('단일');
    expect(spellRangeText('singleHigh')).toBe('단일 고집중');
    expect(spellRangeText('smallArea')).toBe('좁은 범위');
    expect(spellRangeText('area')).toBe('광역');
    expect(spellRangeText('defense')).toBe('방어');
    expect(spellRangeText('heal')).toBe('회복');
  });
});
