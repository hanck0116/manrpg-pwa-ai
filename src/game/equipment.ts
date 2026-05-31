import { equipmentToRewardItem } from '../rules/equipment';
import { appendLog, type EquipmentSlot, type GameState } from '../state/gameState';
import { refreshPlayer } from './characterUpdate';

const maintenancePhases: GameState['phase'][] = ['reward-pending', 'level-up-pending', 'floor-cleared', 'battle-ended'];

const isMaintenancePhase = (state: GameState): boolean => maintenancePhases.includes(state.phase);

export const equipItem = (state: GameState, itemId: string): GameState => {
  if (!isMaintenancePhase(state)) {
    return appendLog(state, '장비는 정비 단계에서만 착용할 수 있습니다.');
  }

  const item = state.inventory.find((inventoryItem) => inventoryItem.id === itemId);

  if (!item?.equipment) {
    return appendLog(state, '착용할 장비를 인벤토리에서 찾을 수 없습니다.');
  }

  const previous = state.equipment[item.equipment.slot];
  const inventoryWithoutNewItem = state.inventory.filter((inventoryItem) => inventoryItem.id !== itemId);
  const nextInventory = previous ? [...inventoryWithoutNewItem, equipmentToRewardItem(previous)] : inventoryWithoutNewItem;
  const updated = refreshPlayer({
    ...state,
    inventory: nextInventory,
    equipment: {
      ...state.equipment,
      [item.equipment.slot]: item.equipment
    }
  });

  return appendLog(updated, `${item.equipment.name}을(를) 착용했습니다.`);
};

export const unequipItem = (state: GameState, slot: EquipmentSlot): GameState => {
  if (!isMaintenancePhase(state)) {
    return appendLog(state, '장비는 정비 단계에서만 해제할 수 있습니다.');
  }

  const equipment = state.equipment[slot];

  if (!equipment) {
    return appendLog(state, '해당 슬롯에 착용 중인 장비가 없습니다.');
  }

  const { [slot]: _removed, ...restEquipment } = state.equipment;
  const updated = refreshPlayer({
    ...state,
    inventory: [...state.inventory, equipmentToRewardItem(equipment)],
    equipment: restEquipment
  });

  return appendLog(updated, `${equipment.name}을(를) 해제했습니다.`);
};

