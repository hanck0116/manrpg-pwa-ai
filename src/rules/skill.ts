import type { PlayerSkill, SkillResourceType, SkillTiming } from '../state/gameState';

export type SkillInput = {
  name: string;
  description?: string;
  resourceType: SkillResourceType;
  timing?: SkillTiming;
  multiplier: number;
  cost?: number;
  range?: number;
  target?: 'enemy' | 'self';
  effectType: PlayerSkill['effectType'];
  source?: string;
};

export type SkillValidationResult = {
  ok: boolean;
  message: string;
};

const createId = (prefix: string): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? `${prefix}-${crypto.randomUUID()}` : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const validResourceTypes: SkillResourceType[] = ['outer', 'inner', 'sword', 'magic', 'none'];
const validEffectTypes: PlayerSkill['effectType'][] = ['damage', 'heal', 'guard', 'todo'];

export const validateSkillInput = (input: SkillInput): SkillValidationResult => {
  if (!input.name.trim()) {
    return { ok: false, message: '스킬 이름이 필요합니다.' };
  }

  if (!validResourceTypes.includes(input.resourceType)) {
    return { ok: false, message: '스킬 자원 유형이 올바르지 않습니다.' };
  }

  if (!validEffectTypes.includes(input.effectType)) {
    return { ok: false, message: '스킬 효과 유형이 올바르지 않습니다.' };
  }

  if (!Number.isFinite(input.multiplier) || input.multiplier <= 0) {
    return { ok: false, message: '스킬 배율은 0보다 큰 숫자여야 합니다.' };
  }

  return { ok: true, message: '스킬 입력이 유효합니다.' };
};

export const createPlayerSkill = (input: SkillInput): PlayerSkill => {
  const validation = validateSkillInput(input);

  if (!validation.ok) {
    throw new Error(validation.message);
  }

  return {
    id: createId('skill'),
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    resourceType: input.resourceType,
    timing: input.timing ?? 'main',
    multiplier: input.multiplier,
    cost: input.cost,
    range: input.range,
    target: input.target ?? (input.effectType === 'damage' ? 'enemy' : 'self'),
    effectType: input.effectType,
    source: input.source
  };
};

export const getDefaultSkillTemplates = (): PlayerSkill[] => [
  createPlayerSkill({
    name: '외공 공격',
    resourceType: 'outer',
    timing: 'main',
    effectType: 'damage',
    target: 'enemy',
    multiplier: 1,
    source: 'default-template'
  }),
  createPlayerSkill({
    name: '내공 회복',
    resourceType: 'inner',
    timing: 'main',
    effectType: 'heal',
    target: 'self',
    multiplier: 1,
    source: 'default-template'
  }),
  createPlayerSkill({
    name: '검기 공격',
    resourceType: 'sword',
    timing: 'main',
    effectType: 'damage',
    target: 'enemy',
    multiplier: 1,
    source: 'default-template'
  })
];
