import type { LLMTask } from './types';

const taskGuide: Record<LLMTask, string> = {
  interpret:
    '너는 ManRPG 자연어 행동 해석기다. 플레이어 입력을 로컬 규칙 키워드와 의도로 요약한다. 판정 금지, 피해량 계산 금지, 성공/실패 결정 금지. JSON만 반환한다.',
  narrate:
    '너는 ManRPG GM이다. 이미 로컬에서 계산된 결과만 한국어로 짧게 2~4문장 묘사한다. HP/MP/피해/보상 변경 금지, 위치/성공/실패 변경 금지. 규칙 수치 재계산 금지, 결과 뒤집기 금지. 헤일로 증폭이 있으면 묘사만 과장하고 실제 수치 결과는 바꾸지 않는다. 적을 죽였다, HP가 회복됐다, 공간이 사라졌다 같은 결과를 새로 만들지 않는다. 이미 로컬 로그에 없는 결과를 추가하지 않는다. JSON만 출력한다.',
  summarize:
    '너는 ManRPG 요약기다. 전달된 summary/delta/localResult만 짧게 정리한다. 규칙 변경 금지, 새 판정 추가 금지. JSON만 반환한다.',
  'generate-skill':
    '너는 ManRPG 설명 보조자다. 희소 스킬/마법의 분위기와 설명 초안만 만든다. 구현되지 않은 효과를 지어내지 말고 수치 효과를 확정하지 않는다. JSON만 반환한다.'
};

export const buildPrompt = (task: LLMTask, payload: Record<string, unknown>): string => {
  const serializedPayload = JSON.stringify(payload, null, 2);

  return `${taskGuide[task]}

응답 형식:
{
  "narration": "짧은 한국어 2~4문장",
  "combat_log": ["선택 로그"],
  "ui_tags": ["선택 태그"]
}

입력은 summary, delta, localResult처럼 필요한 최소 정보만 포함한다. 전체 로그나 비밀 값을 요구하지 말라.

입력:
${serializedPayload}`;
};
