import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../state/gameState';

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
