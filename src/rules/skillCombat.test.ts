import { describe, expect, it } from 'vitest';
import { createPlayerSkill } from './skill';
import { resolveSkillUse } from './skillCombat';
import { createInitialGameState } from '../state/gameState';

describe('skill combat', () => {
  it('damage skill decreases enemy hp', () => {
    const state = createInitialGameState();
    const skill = createPlayerSkill({ name: '외공 공격', resourceType: 'outer', effectType: 'damage', multiplier: 1 });
    const result = resolveSkillUse(state.player, state.enemy, skill);

    expect(result.enemy.hp).toBeLessThan(state.enemy.hp);
  });

  it('heal skill restores player hp without exceeding maxHP', () => {
    const state = createInitialGameState();
    const player = { ...state.player, hp: 1 };
    const skill = createPlayerSkill({ name: '내공 회복', resourceType: 'inner', effectType: 'heal', target: 'self', multiplier: 100 });
    const result = resolveSkillUse(player, state.enemy, skill);

    expect(result.player.hp).toBe(player.derived.maxHP);
  });

  it('guard skill sets player guarding true', () => {
    const state = createInitialGameState();
    const skill = createPlayerSkill({ name: '방어술', resourceType: 'none', effectType: 'guard', target: 'self', multiplier: 1 });
    const result = resolveSkillUse(state.player, state.enemy, skill);

    expect(result.player.guarding).toBe(true);
  });
});

it('uses optional original-sheet deltas and damage multiplier before fallback', () => {
  const state = createInitialGameState();
  const skill = createPlayerSkill({
    name: '확장 스킬',
    resourceType: 'none',
    effectType: 'damage',
    multiplier: 1,
    mpDelta: -1,
    hpDelta: 1,
    damageMultiplier: 2,
    judgeStat: 'strength',
    judgeBonus: 1
  });
  const result = resolveSkillUse({ ...state.player, hp: 5 }, state.enemy, skill);

  expect(result.player.mp).toBe(state.player.mp - 1);
  expect(result.player.hp).toBe(6);
  expect(result.enemy.hp).toBe(state.enemy.hp - state.player.derived.attack * 2);
});

it('blocks passive skills in combat', () => {
  const state = createInitialGameState();
  const skill = createPlayerSkill({ name: '패시브', resourceType: 'none', effectType: 'todo', multiplier: 1, kind: 'passive', timing: 'passive', passiveStat: 'strength', passiveValue: 1 });
  const result = resolveSkillUse(state.player, state.enemy, skill);

  expect(result.log).toContain('패시브');
  expect(result.enemy.hp).toBe(state.enemy.hp);
});
