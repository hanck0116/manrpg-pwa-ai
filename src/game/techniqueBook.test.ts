import { describe, expect, it } from 'vitest';
import { addPlayerTechnique, unlockTechniqueSource } from './techniqueBook';
import { createInitialGameState } from '../state/gameState';

describe('technique book', () => {
  const maintenanceState = () => ({ ...createInitialGameState(), setupMode: false, phase: 'floor-cleared' as const });

  it('unlocks source once', () => {
    const first = unlockTechniqueSource(maintenanceState(), '공법');
    const second = unlockTechniqueSource(first.state, '공법');
    expect(first.state.techniqueSources).toEqual(['공법']);
    expect(second.state.techniqueSources).toEqual(['공법']);
    expect(second.unlocked).toBe(false);
  });

  it('rejects missing source and duplicate source technique creation', () => {
    const missing = addPlayerTechnique(maintenanceState(), { name: '격', source: '공법', kind: 'attack', mpDelta: 0, hpDelta: 0, damageMultiplier: 1, judgeStat: 'none', judgeBonus: 0 });
    expect(missing.techniques).toHaveLength(0);

    const unlocked = unlockTechniqueSource(maintenanceState(), '공법').state;
    const created = addPlayerTechnique(unlocked, { name: '격', source: '공법', kind: 'attack', mpDelta: 0, hpDelta: 0, damageMultiplier: 1, judgeStat: 'none', judgeBonus: 0 });
    const duplicate = addPlayerTechnique(created, { name: '또 격', source: '공법', kind: 'attack', mpDelta: 0, hpDelta: 0, damageMultiplier: 1, judgeStat: 'none', judgeBonus: 0 });
    expect(created.techniques).toHaveLength(1);
    expect(duplicate.techniques).toHaveLength(1);
  });
});
