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

  it('amplifies next damage action to enemy hp 0 without non-finite values', () => {
    const prepared = useHaloAmplification(battleHalo('amplification'), '기본 공격');
    const queued = enqueueAction(prepared, { id: 'a', type: 'basic-attack', label: '기본 공격' });
    const result = executeActionQueue(queued);
    expect(result.enemy.hp).toBe(0);
    expect(result.halo.pendingAmplification).toBeUndefined();
    expect(Number.isFinite(result.enemy.hp)).toBe(true);
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
