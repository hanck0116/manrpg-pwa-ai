import { describe, expect, it } from 'vitest';
import { createInitialGameState, type GameState } from '../state/gameState';
import { runAngelTrialWithAttack, runAngelTrialWithManualScore, resetAngelTrialClaims } from './angelTrial';

const trialState = (): GameState => ({
  ...createInitialGameState(),
  setupMode: false,
  phase: 'floor-cleared',
  player: {
    ...createInitialGameState().player,
    derived: {
      ...createInitialGameState().player.derived,
      attack: 40
    }
  }
});

describe('angelTrial game', () => {
  it('records lastScore when applying trial with basic attack', () => {
    const next = runAngelTrialWithAttack(trialState());

    expect(next.angelTrial.lastScore).toBe(40);
  });

  it('applies new rewards into inventory or coin', () => {
    const next = runAngelTrialWithManualScore(trialState(), 60);

    expect(next.player.stats.coin).toBe(4);
    expect(next.inventory.some((item) => item.type === 'magicTicket')).toBe(true);
    expect(next.inventory.some((item) => item.type === 'choice')).toBe(true);
  });

  it('does not grant duplicate rewards for the same score', () => {
    const first = runAngelTrialWithManualScore(trialState(), 40);
    const second = runAngelTrialWithManualScore(first, 40);

    expect(second.player.stats.coin).toBe(first.player.stats.coin);
    expect(second.inventory).toHaveLength(first.inventory.length);
    expect(second.angelTrial.lastResult).toContain('신규 보상 없음');
  });

  it('grants only unclaimed lower tiers when a higher score is applied', () => {
    const first = runAngelTrialWithManualScore(trialState(), 20);
    const second = runAngelTrialWithManualScore(first, 60);

    expect(second.angelTrial.claimedScores).toEqual([10, 20, 30, 40, 60]);
    expect(second.player.stats.coin).toBe(4);
  });

  it('resets claimed scores to an empty array', () => {
    const next = resetAngelTrialClaims(runAngelTrialWithManualScore(trialState(), 40));

    expect(next.angelTrial.claimedScores).toEqual([]);
  });

  it('does not create bosses or extra enemies', () => {
    const state = trialState();
    const next = runAngelTrialWithManualScore(state, 1000);

    expect(next.enemy.id).toBe(state.enemy.id);
    expect(next.enemy.name).toBe(state.enemy.name);
    expect('boss' in next).toBe(false);
  });
});
