import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../state/gameState';
import { applyEquipmentBonuses, createEquipmentItem, equipmentToRewardItem, getDefaultEquipmentItems, getEquipmentLabel } from './equipment';

describe('equipment rules', () => {
  it('creates debug equipment reward items', () => {
    const items = getDefaultEquipmentItems().map(equipmentToRewardItem);

    expect(items).toHaveLength(3);
    expect(items.map((item) => item.type)).toEqual(['equipment', 'equipment', 'equipment']);
    expect(items.map((item) => item.equipment?.slot)).toEqual(['weapon', 'armor', 'accessory']);
  });

  it('labels equipment with slot and bonuses', () => {
    const equipment = createEquipmentItem({ name: '훈련용 검', slot: 'weapon', derivedBonus: { attack: 1 }, source: 'debug' });

    expect(getEquipmentLabel(equipment)).toContain('공격 +1');
  });

  it('applies derived bonuses without healing current hp or mp', () => {
    const state = createInitialGameState();
    const boosted = applyEquipmentBonuses(state.player, {
      weapon: createEquipmentItem({ name: '훈련용 검', slot: 'weapon', derivedBonus: { attack: 1 } }),
      armor: createEquipmentItem({ name: '훈련용 갑옷', slot: 'armor', derivedBonus: { maxHP: 2 } })
    });

    expect(boosted.derived.attack).toBe(state.player.derived.attack + 1);
    expect(boosted.derived.maxHP).toBe(state.player.derived.maxHP + 2);
    expect(boosted.hp).toBe(state.player.hp);
  });
});

