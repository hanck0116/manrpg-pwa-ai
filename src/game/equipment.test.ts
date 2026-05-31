import { describe, expect, it, vi } from 'vitest';
import { equipmentToRewardItem, getDefaultEquipmentItems } from '../rules/equipment';
import { createInitialGameState, type GameState } from '../state/gameState';
import { loadGameStub, saveGameStub } from '../storage/save';
import { grantTestEquipment } from './debugTools';
import { equipItem, unequipItem } from './equipment';

const maintenanceState = (): GameState => ({
  ...createInitialGameState(),
  setupMode: false,
  phase: 'floor-cleared',
  turnOwner: 'player'
});

const battleState = (): GameState => ({
  ...createInitialGameState(),
  setupMode: false,
  phase: 'player-main',
  turnOwner: 'player'
});

describe('equipment flow', () => {
  it('equips an inventory equipment item into its slot', () => {
    const item = equipmentToRewardItem(getDefaultEquipmentItems()[0]);
    const next = equipItem({ ...maintenanceState(), inventory: [item] }, item.id);

    expect(next.inventory).toHaveLength(0);
    expect(next.equipment.weapon?.name).toBe('훈련용 검');
    expect(next.player.derived.attack).toBe(maintenanceState().player.derived.attack + 1);
  });

  it('returns previous same-slot equipment to inventory', () => {
    const [firstWeapon] = getDefaultEquipmentItems();
    const secondWeapon = { ...firstWeapon, id: 'second-weapon', name: '두 번째 검', derivedBonus: { attack: 2 } };
    const firstEquipped = equipItem({ ...maintenanceState(), inventory: [equipmentToRewardItem(firstWeapon)] }, equipmentToRewardItem(firstWeapon).id);
    const next = equipItem({ ...firstEquipped, inventory: [equipmentToRewardItem(secondWeapon)] }, equipmentToRewardItem(secondWeapon).id);

    expect(next.equipment.weapon?.name).toBe('두 번째 검');
    expect(next.inventory[0].equipment?.name).toBe('훈련용 검');
  });

  it('unequips equipment back to inventory and clamps hp/mp to new max', () => {
    const armor = getDefaultEquipmentItems()[1];
    const equipped = equipItem({ ...maintenanceState(), inventory: [equipmentToRewardItem(armor)] }, equipmentToRewardItem(armor).id);
    const overhealed = {
      ...equipped,
      player: {
        ...equipped.player,
        hp: equipped.player.derived.maxHP
      }
    };
    const next = unequipItem(overhealed, 'armor');

    expect(next.equipment.armor).toBeUndefined();
    expect(next.inventory[0].equipment?.name).toBe('훈련용 갑옷');
    expect(next.player.hp).toBe(next.player.derived.maxHP);
  });

  it('blocks equip and unequip during battle', () => {
    const item = equipmentToRewardItem(getDefaultEquipmentItems()[0]);
    const state = { ...battleState(), inventory: [item] };
    const equipped = equipItem(state, item.id);
    const unequipped = unequipItem({ ...battleState(), equipment: { weapon: getDefaultEquipmentItems()[0] } }, 'weapon');

    expect(equipped.equipment.weapon).toBeUndefined();
    expect(unequipped.equipment.weapon).toBeDefined();
  });

  it('saveVersion 12 validates equipment', () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage.set(key, value);
      }),
      removeItem: vi.fn((key: string) => {
        storage.delete(key);
      })
    });

    const item = equipmentToRewardItem(getDefaultEquipmentItems()[0]);
    const state = equipItem({ ...maintenanceState(), inventory: [item] }, item.id);

    expect(saveGameStub(state)).toContain('saveVersion 12');
    expect(loadGameStub().equipment.weapon?.name).toBe('훈련용 검');

    vi.unstubAllGlobals();
  });

  it('grantTestEquipment adds three equipment reward items', () => {
    expect(grantTestEquipment(maintenanceState()).inventory.filter((item) => item.type === 'equipment')).toHaveLength(3);
  });
});

