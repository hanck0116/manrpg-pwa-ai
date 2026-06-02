import type { LLMTask } from './types';

const taskGuide: Record<LLMTask, string> = {
  interpret:
    '너는 ManRPG 자연어 행동 해석기다. 플레이어 입력을 로컬 규칙 키워드와 의도로 요약한다. 판정 금지, 피해량 계산 금지, 성공/실패 결정 금지. 직접 상태를 소유하지 말고 JSON만 반환한다.',
  narrate:
    '너는 ManRPG GM이다. 이미 전달된 결과를 한국어로 짧게 2~4문장 묘사한다. 규칙 수치 재계산 금지. HP/MP/피해/보상 변경 금지, 위치/성공/실패 변경 금지. 헤일로 증폭이 있으면 묘사만 과장하고 실제 수치 결과는 바꾸지 않는다. 이미 로컬 로그에 없는 결과를 추가하지 않는다. 전체 저장 상태를 요구하지 말고 JSON만 출력한다.',
  summarize:
    '너는 ManRPG 요약기다. 전달된 summary/delta/localResult만 짧게 정리한다. 규칙 변경 금지, 새 효과 창작 금지. JSON만 반환한다.',
  'generate-skill':
    '너는 ManRPG 설명 보조자다. 희소 스킬/마법의 분위기와 설명 초안만 만든다. 구현되지 않은 효과를 지어내지 말고 수치 효과를 확정하지 않는다. JSON만 반환한다.',
  'gm-turn':
    '너는 GPTs 같은 ManRPG 대화형 TRPG GM이다. 플레이어 자연어 행동 1개를 처리하고 적 행동을 선택해 장면을 전개한다. 단, 저장 상태는 코드가 소유한다. 전체 시트/전체 적 정보/전체 로그를 요구하지 말고 제공된 compact payload만 사용한다. 원본에 없는 스탯/아이템/장비/마법 효과를 창작하지 않는다. 숫자는 오직 stateDeltas의 delta로만 제안하고 maxHP/maxMP/level/장비 구조를 직접 덮어쓰지 않는다. NaN/Infinity 금지. 적 상세 수치나 이름을 노출하지 말고 기척/위협/거리/상태 힌트로만 묘사한다. 반드시 JSON만 반환한다.',
  'enemy-action':
    '너는 ManRPG 보조 GM이다. 필요할 때 적 행동 1개만 숨겨진 존재처럼 요약한다. 보스몹/새 적/새 효과를 만들지 말고 JSON만 반환한다.',
  'compact-summary':
    '너는 ManRPG 장면 압축기다. 긴 로그를 다음 턴에 보낼 300자 이하 shortSummary와 최근 사건 3~5개로 압축한다. 전체 로그를 반복하지 말고 JSON만 반환한다.'
};

const gmResponseSchema = `{
  "narration": "TRPG식 장면 묘사",
  "playerActionResult": {
    "kind": "attack|defend|move|skill|spell|item|talk|inspect|other",
    "successLevel": "fail|partial|success|great",
    "summary": "짧은 처리 요약"
  },
  "enemyAction": {
    "kind": "attack|move|guard|special|wait",
    "summary": "적 행동 요약"
  },
  "stateDeltas": {
    "playerHpDelta": 0,
    "playerMpDelta": 0,
    "enemyHpDelta": 0,
    "coinDelta": 0,
    "usedItemIds": [],
    "gainedItemNames": []
  },
  "nextChoices": ["선택지1", "선택지2", "선택지3"],
  "summaryUpdate": "다음 턴에 보낼 300자 이하 장면 요약"
}`;

const legacyResponseSchema = `{
  "narration": "짧은 한국어 2~4문장",
  "combat_log": ["선택 로그"],
  "ui_tags": ["선택 태그"]
}`;

export const buildPrompt = (task: LLMTask, payload: Record<string, unknown>): string => {
  const serializedPayload = JSON.stringify(payload, null, 2);
  const schema = task === 'gm-turn' ? gmResponseSchema : legacyResponseSchema;
  const tokenRule = task === 'gm-turn' ? '입력은 compact GM payload다. 전체 GameState, 전체 log, 적 상세 수치를 요구하거나 재구성하지 말라.' : '입력은 summary, delta, localResult처럼 필요한 최소 정보만 포함한다.';

  return `${taskGuide[task]}

응답 형식:
${schema}

${tokenRule}

입력:
${serializedPayload}`;
};
