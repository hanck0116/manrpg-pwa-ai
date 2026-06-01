import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../state/gameState';
import { createPlayerTechnique } from './technique';
import { resolveTechniqueUse } from './techniqueCombat';

describe('technique combat', () => {
  it('fails when MP or HP is insufficient', () => {
    const state = createInitialGameState();
    const mp = createPlayerTechnique({ name: '고비용', source: '공법', kind: 'attack', mpDelta: -999, hpDelta: 0, damageMultiplier: 1, judgeStat: 'none', judgeBonus: 0 });
    const hp = createPlayerTechnique({ name: '혈공', source: '무공', kind: 'attack', mpDelta: 0, hpDelta: -999, damageMultiplier: 1, judgeStat: 'none', judgeBonus: 0 });
    expect(resolveTechniqueUse(state.player, state.enemy, mp).enemy.hp).toBe(state.enemy.hp);
    expect(resolveTechniqueUse(state.player, state.enemy, hp).player.hp).toBe(state.player.hp);
  });

  it('does not spend resources or apply effects when judgement fails', () => {
    const state = createInitialGameState();
    const technique = createPlayerTechnique({ name: '실패 기술', source: '공법', kind: 'attack', mpDelta: -1, hpDelta: -1, damageMultiplier: 1, judgeStat: 'strength', judgeBonus: 0 });
    const result = resolveTechniqueUse({ ...state.player, hp: 5 }, state.enemy, technique, () => 0.99);

    expect(result.player.mp).toBe(state.player.mp);
    expect(result.player.hp).toBe(5);
    expect(result.enemy.hp).toBe(state.enemy.hp);
    expect(result.log).toContain('판정 실패');
  });

  it('applies deltas, damage, and defense guarding when judgement succeeds', () => {
    const state = createInitialGameState();
    const technique = createPlayerTechnique({ name: '방어격', source: '공법', kind: 'defense', mpDelta: -1, hpDelta: 1, damageMultiplier: 1, judgeStat: 'wisdom', judgeBonus: 95 });
    const result = resolveTechniqueUse({ ...state.player, hp: 5 }, state.enemy, technique, () => 0);
    expect(result.player.mp).toBe(state.player.mp - 1);
    expect(result.player.hp).toBe(6);
    expect(result.enemy.hp).toBeLessThan(state.enemy.hp);
    expect(result.player.guarding).toBe(true);
    expect(result.log).toContain('판정 결과');
  });

  it('uses existing behavior immediately when judgeStat is none', () => {
    const state = createInitialGameState();
    const technique = createPlayerTechnique({ name: '즉시 기술', source: '공법', kind: 'attack', mpDelta: 0, hpDelta: 0, damageMultiplier: 1, judgeStat: 'none', judgeBonus: 0 });
    const result = resolveTechniqueUse(state.player, state.enemy, technique, () => 0.99);

    expect(result.enemy.hp).toBeLessThan(state.enemy.hp);
    expect(result.log).not.toContain('판정 결과');
  });
});
