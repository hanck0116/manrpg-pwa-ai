import { describe, expect, it, vi } from 'vitest';
import { enqueueAction, executeActionQueue } from './actionQueue';
import { refreshPlayer } from './characterUpdate';
import {
  selectHaloKind,
  tickPlayerControlStatuses,
  useHaloAchievement,
  useHaloAmplification,
  useHaloBirth,
  useHaloDecomposition,
  useHaloDesire,
  useHaloFusion
} from './halo';
import { createInitialGameState, type GameState } from '../state/gameState';
import { createPlayerSkill } from '../rules/skill';

const battleHalo = (selectedKind: GameState['halo']['selectedKind'] = 'amplification'): GameState => {
  const state = createInitialGameState();
  return refreshPlayer({
    ...state,
    setupMode: false,
    phase: 'player-main',
    player: { ...state.player, stats: { ...state.player.stats, traits: ['헤일로'], strength: 20, dexterity: 20, constitution: 20, intelligence: 95 } },
    halo: { ...state.halo, selectedKind, satanActive: selectedKind === 'satan' }
  });
};

describe('game halo effects', () => {
  it('applies satan derived stats without mutating raw stats and removes it on different selection', () => {
    const satan = refreshPlayer(battleHalo('satan'));
    expect(satan.player.stats.strength).toBe(20);
    expect(satan.player.derived.basicAtk).toBeGreaterThan(refreshPlayer(battleHalo('birth')).player.derived.basicAtk);
  });

  it('creates pending amplification and marks it used without changing finite rule numbers', () => {
    const prepared = useHaloAmplification(battleHalo('amplification'), '기본 공격');

    expect(prepared.halo.pendingAmplification).toMatchObject({
      description: '기본 공격',
      createdTurn: prepared.turn,
      consumeOnNextNarration: true
    });
    expect(prepared.halo.usedThisFloor.amplification).toBe(true);
    expect(Number.isFinite(prepared.enemy.hp)).toBe(true);
    expect(Number.isFinite(prepared.player.hp)).toBe(true);
    expect(Number.isFinite(prepared.player.mp)).toBe(true);
  });

  it('does not alter basic attack damage after amplification use', () => {
    const base = battleHalo('amplification');
    const expected = executeActionQueue(enqueueAction(base, { id: 'a', type: 'basic-attack', label: '기본 공격' }));
    const prepared = useHaloAmplification(base, '기본 공격');
    const result = executeActionQueue(enqueueAction(prepared, { id: 'a', type: 'basic-attack', label: '기본 공격' }));

    expect(result.enemy.hp).toBe(expected.enemy.hp);
    expect(result.halo.pendingAmplification).toBeDefined();
    expect(Number.isFinite(result.enemy.hp)).toBe(true);
  });

  it('does not alter skill, spell, technique, or healing results after amplification use', () => {
    const damageSkill = createPlayerSkill({ name: '외공 공격', resourceType: 'none', timing: 'main', effectType: 'damage', multiplier: 1 });
    const healSkill = createPlayerSkill({ name: '내공 회복', resourceType: 'none', timing: 'main', effectType: 'heal', target: 'self', multiplier: 1 });
    const technique = { id: 't1', name: '즉시 기술', source: '공법', kind: 'attack' as const, mpDelta: 0, hpDelta: 0, damageMultiplier: 1, judgeStat: 'none' as const, judgeBonus: 0 };
    const spell = { id: 's1', name: '파이어 애로우', circle: 2, grade: '기초' };
    const base = {
      ...battleHalo('amplification'),
      player: { ...battleHalo('amplification').player, hp: 5 },
      skills: [damageSkill, healSkill],
      techniques: [technique],
      spells: [spell]
    };

    const cases = [
      { type: 'skill' as const, skillId: damageSkill.id, label: '피해 스킬' },
      { type: 'skill' as const, skillId: healSkill.id, label: '회복 스킬' },
      { type: 'spell' as const, spellId: spell.id, label: '마법' },
      { type: 'technique' as const, techniqueId: technique.id, label: '기술' }
    ];

    for (const action of cases) {
      const expected = executeActionQueue(enqueueAction(base, { id: `expected-${action.label}`, ...action }));
      const result = executeActionQueue(enqueueAction(useHaloAmplification(base, action.label), { id: `actual-${action.label}`, ...action }));

      expect(result.enemy.hp).toBe(expected.enemy.hp);
      expect(result.player.hp).toBe(expected.player.hp);
      expect(result.player.mp).toBe(expected.player.mp);
      expect(result.halo.pendingAmplification).toBeDefined();
      expect([result.enemy.hp, result.player.hp, result.player.mp].every(Number.isFinite)).toBe(true);
    }
  });

  it('birth creates known and custom items', () => {
    const known = useHaloBirth(battleHalo('birth'), '외공서');
    expect(known.inventory.at(-1)?.name).toBe('외공서');
    const custom = useHaloBirth({ ...battleHalo('birth'), halo: { ...battleHalo('birth').halo, usedThisFloor: {} } }, '새 물건');
    expect(custom.inventory.at(-1)?.name).toBe('새 물건');
  });

  it('achievement learns only observed spells without duplicates', () => {
    const state = { ...battleHalo('achievement'), spells: [{ id: 's1', name: '파이어볼', circle: 1, grade: '기초' }], halo: { ...battleHalo('achievement').halo, observedSpells: [{ id: 's2', name: '파이어볼', circle: 1, grade: '기초' }, { id: 's3', name: '아이스', circle: 1, grade: '기초' }] } };
    expect(useHaloAchievement(state).spells.map((spell) => spell.name)).toEqual(['파이어볼', '아이스']);
  });

  it('fusion queues a temporary combined technique', () => {
    const state = { ...battleHalo('fusion'), techniques: [
      { id: 't1', name: 'A', source: 'test', kind: 'attack' as const, mpDelta: 1, hpDelta: 0, damageMultiplier: 2, judgeStat: 'strength' as const, judgeBonus: 1 },
      { id: 't2', name: 'B', source: 'test', kind: 'attack' as const, mpDelta: 2, hpDelta: 0, damageMultiplier: 3, judgeStat: 'none' as const, judgeBonus: 2 }
    ] };
    const result = useHaloFusion(state, 't1', 't2');
    expect(result.actionQueue.at(-1)?.type).toBe('technique');
    expect(result.techniques.at(-1)?.damageMultiplier).toBe(5);
  });

  it('decomposition is reaction-only and handles basic and technique sources', () => {
    expect(useHaloDecomposition(battleHalo('decomposition')).log.at(-1)?.message).toContain('반응턴');
    const basic = { ...battleHalo('decomposition'), phase: 'player-reaction' as const, pendingReaction: { against: 'player' as const, attackLog: 'basic', damage: 5, sourceType: 'basic' as const } };
    expect(useHaloDecomposition(basic).pendingReaction).toBeUndefined();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const technique = { ...basic, pendingReaction: { against: 'player' as const, attackLog: 'tech', damage: 5, sourceType: 'technique' as const }, player: { ...basic.player, mp: 0 } };
    expect(useHaloDecomposition(technique).player.mp).toBe(5);
    vi.restoreAllMocks();
  });

  it('desire adds action disabled status and ticks away', () => {
    const desired = useHaloDesire(battleHalo('desire'), '승리', 1);
    expect(desired.statuses.at(-1)?.name).toBe('욕망의 대가');
    expect(tickPlayerControlStatuses(desired).statuses).toHaveLength(0);
  });

  it('selects halo in maintenance', () => {
    const state = { ...battleHalo(), phase: 'floor-cleared' as const };
    expect(selectHaloKind(state, 'satan').halo.selectedKind).toBe('satan');
  });
});
