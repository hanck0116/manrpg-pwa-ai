import { describe, expect, it } from 'vitest';
import { describeSpell, spellManaCost, spellPower } from './spell';

describe('spell calculations', () => {
  it('returns positive mana costs', () => {
    expect(spellManaCost(1, 'single')).toBeGreaterThan(0);
    expect(spellManaCost(9, 'area')).toBeGreaterThan(0);
  });

  it('never produces power greater than the MP basis', () => {
    expect(spellPower(50, 1, 'singleHigh')).toBeLessThanOrEqual(50);
    expect(spellPower(900, 9, 'area')).toBeLessThanOrEqual(900);
  });

  it('describes a spell with category, range, mana, and power', () => {
    expect(describeSpell('Fire Arrow', 1)).toMatchObject({
      category: 'singleHigh',
      rangeText: 'single target'
    });
  });
});
