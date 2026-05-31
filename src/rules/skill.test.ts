import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../state/gameState';
import { addPlayerSkill } from '../game/skillBook';
import { getDefaultSkillTemplates, validateSkillInput } from './skill';

describe('skill rules', () => {
  it('creates default skill templates', () => {
    const templates = getDefaultSkillTemplates();

    expect(templates.map((skill) => skill.name)).toEqual(['외공 공격', '내공 회복', '검기 공격']);
    expect(templates.every((skill) => skill.multiplier === 1)).toBe(true);
  });

  it('rejects invalid multiplier', () => {
    expect(
      validateSkillInput({
        name: '잘못된 스킬',
        resourceType: 'outer',
        effectType: 'damage',
        multiplier: 0
      }).ok
    ).toBe(false);
  });

  it('adds a created skill to state.skills during maintenance', () => {
    const state = {
      ...createInitialGameState(),
      setupMode: false,
      phase: 'floor-cleared' as const
    };
    const next = addPlayerSkill(state, {
      name: '외공 공격',
      resourceType: 'outer',
      effectType: 'damage',
      multiplier: 1
    });

    expect(next.skills).toHaveLength(1);
    expect(next.skills[0]).toMatchObject({ name: '외공 공격', effectType: 'damage' });
  });
});
