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

  it('applies deltas, damage, and defense guarding', () => {
    const state = createInitialGameState();
    const technique = createPlayerTechnique({ name: '방어격', source: '공법', kind: 'defense', mpDelta: -1, hpDelta: 1, damageMultiplier: 1, judgeStat: 'wisdom', judgeBonus: 1 });
    const result = resolveTechniqueUse({ ...state.player, hp: 5 }, state.enemy, technique);
    expect(result.player.mp).toBe(state.player.mp - 1);
    expect(result.player.hp).toBe(6);
    expect(result.enemy.hp).toBeLessThan(state.enemy.hp);
    expect(result.player.guarding).toBe(true);
  });
});
