import { createPlayerSkill, validateSkillInput, type SkillInput } from '../rules/skill';
import { appendLog, type GameState } from '../state/gameState';

const maintenancePhases: GameState['phase'][] = ['reward-pending', 'level-up-pending', 'floor-cleared', 'battle-ended'];

export const canCreateSkill = (state: GameState): boolean => maintenancePhases.includes(state.phase);

export const addPlayerSkill = (state: GameState, input: SkillInput): GameState => {
  if (!canCreateSkill(state)) {
    return appendLog(state, '스킬 생성은 정비 단계에서만 가능합니다.');
  }

  const validation = validateSkillInput(input);

  if (!validation.ok) {
    return appendLog(state, `스킬 생성 실패: ${validation.message}`);
  }

  const skill = createPlayerSkill(input);

  return appendLog(
    {
      ...state,
      skills: [...state.skills, skill]
    },
    `스킬 생성: ${skill.name} / ${skill.multiplier}배`
  );
};
