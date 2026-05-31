import type { Character, EquipmentItem, EquipmentLoadout, EquipmentSlot, RewardItem } from '../state/gameState';

export type EquipmentInput = Omit<EquipmentItem, 'id'> & { id?: string };

const createId = (prefix: string): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? `${prefix}-${crypto.randomUUID()}` : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const createEquipmentItem = (input: EquipmentInput): EquipmentItem => ({
  id: input.id ?? createId('equipment'),
  name: input.name.trim(),
  slot: input.slot,
  grade: input.grade,
  statBonus: input.statBonus,
  derivedBonus: input.derivedBonus,
  sell: input.sell,
  source: input.source
});

export const getDefaultEquipmentItems = (): EquipmentItem[] => [
  createEquipmentItem({
    name: '훈련용 검',
    slot: 'weapon',
    derivedBonus: { attack: 1 },
    sell: 1,
    source: 'debug'
  }),
  createEquipmentItem({
    name: '훈련용 갑옷',
    slot: 'armor',
    derivedBonus: { maxHP: 2 },
    sell: 1,
    source: 'debug'
  }),
  createEquipmentItem({
    name: '훈련용 반지',
    slot: 'accessory',
    derivedBonus: { maxMP: 2 },
    sell: 1,
    source: 'debug'
  })
];

export const equipmentToRewardItem = (equipment: EquipmentItem): RewardItem => ({
  id: `reward-${equipment.id}`,
  name: equipment.name,
  type: 'equipment',
  grade: equipment.grade,
  sell: equipment.sell ?? 0,
  equipment
});

const slotLabels: Record<EquipmentSlot, string> = {
  weapon: '무기',
  armor: '방어구',
  accessory: '장신구'
};

export const getEquipmentLabel = (equipment: EquipmentItem): string => {
  const bonuses = [
    equipment.derivedBonus?.attack ? `공격 +${equipment.derivedBonus.attack}` : undefined,
    equipment.derivedBonus?.maxHP ? `최대 HP +${equipment.derivedBonus.maxHP}` : undefined,
    equipment.derivedBonus?.maxMP ? `최대 MP +${equipment.derivedBonus.maxMP}` : undefined,
    equipment.derivedBonus?.mpRegen ? `MP 회복 +${equipment.derivedBonus.mpRegen}` : undefined
  ].filter(Boolean);

  return `${slotLabels[equipment.slot]} / ${equipment.name}${bonuses.length ? ` / ${bonuses.join(', ')}` : ''}`;
};

const equippedItems = (equipment: EquipmentLoadout): EquipmentItem[] =>
  [equipment.weapon, equipment.armor, equipment.accessory].filter((item): item is EquipmentItem => item !== undefined);

export const applyEquipmentBonuses = (character: Character, equipment: EquipmentLoadout = {}): Character => {
  const derivedBonus = equippedItems(equipment).reduce(
    (bonus, item) => ({
      attack: bonus.attack + (item.derivedBonus?.attack ?? 0),
      maxHP: bonus.maxHP + (item.derivedBonus?.maxHP ?? 0),
      maxMP: bonus.maxMP + (item.derivedBonus?.maxMP ?? 0),
      mpRegen: bonus.mpRegen + (item.derivedBonus?.mpRegen ?? 0)
    }),
    { attack: 0, maxHP: 0, maxMP: 0, mpRegen: 0 }
  );
  const derived = {
    ...character.derived,
    attack: Math.max(0, character.derived.attack + derivedBonus.attack),
    maxHP: Math.max(1, character.derived.maxHP + derivedBonus.maxHP),
    maxMP: Math.max(0, character.derived.maxMP + derivedBonus.maxMP),
    mpRegen: Math.max(0, character.derived.mpRegen + derivedBonus.mpRegen)
  };

  return {
    ...character,
    derived,
    hp: Math.min(character.hp, derived.maxHP),
    mp: Math.min(character.mp, derived.maxMP)
  };
};

