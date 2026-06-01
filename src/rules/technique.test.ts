import { describe, expect, it } from 'vitest';
import { createPlayerTechnique, isTechniqueSourceName, validateTechniqueInput } from './technique';

describe('technique rules', () => {
  it('recognizes technique source names', () => {
    expect(isTechniqueSourceName('공법')).toBe(true);
    expect(isTechniqueSourceName('심법')).toBe(false);
  });

  it('requires unlocked technique fields to be valid', () => {
    expect(validateTechniqueInput({ name: '', source: '공법', kind: 'attack', mpDelta: 0, hpDelta: 0, damageMultiplier: 1, judgeStat: 'none', judgeBonus: 0 }).ok).toBe(false);
    expect(validateTechniqueInput({ name: '격', source: '공법', kind: 'attack', mpDelta: 0, hpDelta: 0, damageMultiplier: -1, judgeStat: 'none', judgeBonus: 0 }).ok).toBe(false);
  });

  it('creates a player technique', () => {
    expect(createPlayerTechnique({ name: '격', source: '공법', kind: 'attack', mpDelta: -1, hpDelta: 0, damageMultiplier: 1.5, judgeStat: 'strength', judgeBonus: 2 })).toMatchObject({ name: '격', source: '공법' });
  });
});
