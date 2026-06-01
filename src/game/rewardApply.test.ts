import { describe, expect, it } from 'vitest';
import { makeItem } from '../rules/reward';
import { createInitialGameState } from '../state/gameState';
import { useInventoryItem } from './inventory';
import { applyChoiceItemResult } from './rewardApply';

const maintenanceState = () => ({ ...createInitialGameState(), setupMode: false, phase: 'floor-cleared' as const });

describe('reward apply technique sources', () => {
  it('unlocks technique source from choice without adding trait', () => {
    const item = { ...makeItem('묘리 선택권'), type: 'choice' as const, choices: ['공법'] };
    const state = { ...maintenanceState(), inventory: [item], pendingChoice: { id: 'choice', sourceItemId: item.id, sourceItemName: item.name, kind: 'choiceItem' as const, options: [] } };
    const next = applyChoiceItemResult(state, item.id, item.name, '공법');

    expect(next.techniqueSources).toContain('공법');
    expect(next.player.stats.traits).not.toContain('공법');
    expect(next.inventory).toHaveLength(0);
    expect(next.pendingChoice).toBeUndefined();
  });

  it('unlocks technique source from inventory item use', () => {
    const item = makeItem('오리지널 스킬');
    const next = useInventoryItem({ ...maintenanceState(), inventory: [item] }, item.id);

    expect(next.techniqueSources).toContain('오리지널 스킬');
    expect(next.inventory).toHaveLength(0);
  });
});
