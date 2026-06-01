import type { PlayerTechnique, TechniqueJudgeStat, TechniqueKind } from '../state/gameState';

export type TechniqueInput = {
  name: string;
  source: string;
  kind: TechniqueKind;
  mpDelta: number;
  hpDelta: number;
  damageMultiplier: number;
  judgeStat: TechniqueJudgeStat;
  judgeBonus: number;
  description?: string;
};

export type TechniqueValidationResult = {
  ok: boolean;
  message: string;
};

export const TECHNIQUE_SOURCE_NAMES = [
  '공법',
  '무공',
  '극기',
  '오리지널 스킬',
  '하급 정령',
  '중급 정령',
  '상급 정령',
  '정령왕',
  '헤일로',
  '입천',
  '유물',
  '연혼염',
  '흑염의 영체화',
  '빙백연혼',
  '앙케 라'
] as const;

export const validTechniqueKinds: TechniqueKind[] = ['attack', 'defense', 'heal', 'buff', 'debuff', 'move', 'special'];
export const validTechniqueJudgeStats: TechniqueJudgeStat[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'appearance', 'none'];

const createId = (prefix: string): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? `${prefix}-${crypto.randomUUID()}` : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const isTechniqueSourceName = (name: string): boolean => TECHNIQUE_SOURCE_NAMES.includes(name as (typeof TECHNIQUE_SOURCE_NAMES)[number]);

export const validateTechniqueInput = (input: TechniqueInput): TechniqueValidationResult => {
  if (!input.name.trim()) return { ok: false, message: '기술 이름이 필요합니다.' };
  if (!input.source.trim()) return { ok: false, message: '기술 제작 출처가 필요합니다.' };
  if (!validTechniqueKinds.includes(input.kind)) return { ok: false, message: '기술 유형이 올바르지 않습니다.' };
  if (!Number.isFinite(input.mpDelta)) return { ok: false, message: 'MP 변화량은 숫자여야 합니다.' };
  if (!Number.isFinite(input.hpDelta)) return { ok: false, message: 'HP 변화량은 숫자여야 합니다.' };
  if (!Number.isFinite(input.damageMultiplier) || input.damageMultiplier < 0) return { ok: false, message: '공격 피해 배수는 0 이상 숫자여야 합니다.' };
  if (!validTechniqueJudgeStats.includes(input.judgeStat)) return { ok: false, message: '판정 스탯이 올바르지 않습니다.' };
  if (!Number.isFinite(input.judgeBonus)) return { ok: false, message: '판정 보정은 숫자여야 합니다.' };
  return { ok: true, message: '기술 입력이 유효합니다.' };
};

export const createPlayerTechnique = (input: TechniqueInput): PlayerTechnique => {
  const validation = validateTechniqueInput(input);
  if (!validation.ok) throw new Error(validation.message);

  return {
    id: createId('technique'),
    name: input.name.trim(),
    source: input.source.trim(),
    kind: input.kind,
    mpDelta: input.mpDelta,
    hpDelta: input.hpDelta,
    damageMultiplier: input.damageMultiplier,
    judgeStat: input.judgeStat,
    judgeBonus: input.judgeBonus,
    description: input.description?.trim() || undefined
  };
};
