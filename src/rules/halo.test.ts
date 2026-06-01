import { describe, expect, it } from 'vitest';
import { canUseHalo, hasHaloAccess, markHaloUsedThisFloor, resetHaloFloorUses } from './halo';
import { createInitialGameState, type GameState } from '../state/gameState';

const withHalo = (): GameState => {
  const state = createInitialGameState();
  return {
    ...state,
    setupMode: false,
    phase: 'floor-cleared' as const,
    player: { ...state.player, stats: { ...state.player.stats, traits: ['헤일로'] } },
    halo: { ...state.halo, selectedKind: 'amplification' as const }
  };
};

describe('halo core rules', () => {
  it('blocks use without halo access', () => {
    const state = createInitialGameState();
    expect(hasHaloAccess(state)).toBe(false);
    expect(canUseHalo({ ...state, halo: { ...state.halo, selectedKind: 'amplification' } }, 'amplification').ok).toBe(false);
  });

  it('allows selected halo with halo trait', () => {
    const state = withHalo();
    expect(hasHaloAccess(state)).toBe(true);
    expect(canUseHalo(state, 'amplification').ok).toBe(true);
  });

  it('limits amplification extinction and birth once per floor', () => {
    let state = withHalo();
    state = markHaloUsedThisFloor(state, 'amplification');
    expect(canUseHalo(state, 'amplification').ok).toBe(false);
    expect(resetHaloFloorUses(state).halo.usedThisFloor).toEqual({});
  });
});
