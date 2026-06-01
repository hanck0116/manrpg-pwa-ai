import { createPlayerTechnique, validateTechniqueInput, type TechniqueInput } from '../rules/technique';
import { appendLog, type GameState } from '../state/gameState';

const maintenancePhases: GameState['phase'][] = ['reward-pending', 'level-up-pending', 'floor-cleared', 'battle-ended'];

export const canCreateTechnique = (state: GameState): boolean => maintenancePhases.includes(state.phase);

export const unlockTechniqueSource = (state: GameState, source: string): { state: GameState; unlocked: boolean; message: string } => {
  if (state.techniqueSources.includes(source)) {
    return { state, unlocked: false, message: `${source} 기술 제작 출처는 이미 해금되어 있습니다.` };
  }

  return {
    state: {
      ...state,
      techniqueSources: [...state.techniqueSources, source]
    },
    unlocked: true,
    message: `${source} 기술 제작 출처를 해금했습니다.`
  };
};

export const addPlayerTechnique = (state: GameState, input: TechniqueInput): GameState => {
  if (!canCreateTechnique(state)) return appendLog(state, '기술 제작은 정비 단계에서만 가능합니다.');
  if (!state.techniqueSources.includes(input.source)) return appendLog(state, '기술 제작 실패: 해금된 출처만 기술 제작에 사용할 수 있습니다.');
  if (state.techniques.some((technique) => technique.source === input.source)) return appendLog(state, '기술 제작 실패: 같은 출처로는 기술을 1개만 제작할 수 있습니다.');

  const validation = validateTechniqueInput(input);
  if (!validation.ok) return appendLog(state, `기술 제작 실패: ${validation.message}`);

  const technique = createPlayerTechnique(input);
  return appendLog(
    {
      ...state,
      techniques: [...state.techniques, technique]
    },
    `기술 제작 성공: ${technique.name} (${technique.source})`
  );
};
