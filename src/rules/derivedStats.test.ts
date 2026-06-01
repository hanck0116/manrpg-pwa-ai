import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../state/gameState';
import { calcDerivedStats } from './derivedStats';

describe('initial battle structure', () => {
  it('keeps exactly one player character', () => {
    const state = createInitialGameState();

    expect(state.player.kind).toBe('player');
    expect(Array.isArray((state as unknown as { players?: unknown[] }).players)).toBe(false);
  });

  it('keeps exactly one enemy character', () => {
    const state = createInitialGameState();

    expect(state.enemy.kind).toBe('enemy');
    expect(Array.isArray((state as unknown as { enemies?: unknown[] }).enemies)).toBe(false);
  });
});

describe('trait derived stats refinement', () => {
  const deriveWithTraits = (traits: string[]) => {
    const state = createInitialGameState();
    return calcDerivedStats({ ...state.player.stats, traits });
  };

  it('applies simbeop maxMP and mpRegen x2', () => {
    const base = deriveWithTraits([]);
    const simbeop = deriveWithTraits(['심법']);

    expect(simbeop.maxMP).toBe(base.maxMP * 2);
    expect(simbeop.mpRegen).toBe(base.mpRegen * 2);
  });

  it('applies mental transcendence maxMP x2 and stacks with simbeop to x4', () => {
    const base = deriveWithTraits([]);
    expect(deriveWithTraits(['심적초월']).maxMP).toBe(base.maxMP * 2);
    expect(deriveWithTraits(['심법', '심적초월']).maxMP).toBe(base.maxMP * 4);
  });

  it('applies time split multi x2', () => {
    const base = deriveWithTraits([]);
    expect(deriveWithTraits(['시분할']).multi).toBe(base.multi * 2);
  });

  it('applies implemented attack multiplier traits', () => {
    const base = deriveWithTraits([]);
    expect(deriveWithTraits(['연혼염', '흑염의 영체화', '헤일로', '입천', '앙케 라']).attack).toBeGreaterThan(base.attack);
  });
});
