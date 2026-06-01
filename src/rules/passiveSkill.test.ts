import { describe, expect, it } from 'vitest';
import { enqueueAction } from '../game/actionQueue';
import { refreshPlayer } from '../game/characterUpdate';
import { createInitialGameState } from '../state/gameState';
import { createPlayerSkill } from './skill';

describe('passive skills', () => {
  it('adds passive strength to attack without mutating original stats', () => {
    const state = createInitialGameState();
    const skill = createPlayerSkill({ name: '힘 패시브', resourceType: 'none', effectType: 'todo', multiplier: 1, kind: 'passive', timing: 'passive', passiveStat: 'strength', passiveValue: 50 });
    const next = refreshPlayer({ ...state, skills: [skill] });

    expect(next.player.derived.attack).toBeGreaterThan(state.player.derived.attack);
    expect(next.player.stats.strength).toBe(state.player.stats.strength);
  });

  it('adds passive constitution to maxHP and clamps current hp/mp', () => {
    const state = createInitialGameState();
    const skill = createPlayerSkill({ name: '체력 패시브', resourceType: 'none', effectType: 'todo', multiplier: 1, kind: 'passive', timing: 'passive', passiveStat: 'constitution', passiveValue: 5 });
    const next = refreshPlayer({ ...state, player: { ...state.player, hp: 999, mp: 999 }, skills: [skill] });

    expect(next.player.derived.maxHP).toBeGreaterThan(state.player.derived.maxHP);
    expect(next.player.hp).toBe(next.player.derived.maxHP);
    expect(next.player.mp).toBe(next.player.derived.maxMP);
  });

  it('does not enqueue passive skills', () => {
    const state = createInitialGameState();
    const skill = createPlayerSkill({ name: '패시브', resourceType: 'none', effectType: 'todo', multiplier: 1, kind: 'passive', timing: 'passive', passiveStat: 'strength', passiveValue: 1 });
    const next = enqueueAction({ ...state, setupMode: false, phase: 'player-main', skills: [skill] }, { id: 'a', type: 'skill', label: '패시브', skillId: skill.id });

    expect(next.actionQueue).toHaveLength(0);
    expect(next.log.at(-1)?.message).toContain('패시브 스킬');
  });
});
