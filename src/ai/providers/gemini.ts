import type { LLMPayload, LLMResponse, LLMTask } from '../types';

export const callGemini = async (_task: LLMTask, _payload: LLMPayload): Promise<LLMResponse> => ({
  narration: 'Gemini provider stub: 실제 API 호출은 다음 단계에서 구현합니다.',
  combat_log: ['stub:gemini'],
  ui_tags: ['stub']
});
