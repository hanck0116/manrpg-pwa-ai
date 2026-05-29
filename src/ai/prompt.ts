import type { LLMTask } from './types';

const taskGuide: Record<LLMTask, string> = {
  interpret: '플레이어 행동을 로컬 규칙 키워드로 해석하되 판정 결과는 만들지 않는다.',
  narrate: '이미 계산된 로컬 규칙 결과를 짧은 GM 묘사로 바꾼다.',
  summarize: '현재 장면과 전투 로그를 짧게 요약한다.',
  'generate-skill': '로컬 규칙 범위를 넘지 않는 희소 스킬/마법 설명 초안을 만든다.'
};

export const buildPrompt = (task: LLMTask, payload: Record<string, unknown>): string => {
  const serializedPayload = JSON.stringify(payload, null, 2);

  return `${taskGuide[task]}\n\n입력:\n${serializedPayload}`;
};
