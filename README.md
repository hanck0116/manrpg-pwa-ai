# ManRPG PWA AI

ManRPG를 **실행 가능한 PWA 기본 골격 + 로컬 규칙 엔진 + 고정 7x7 맵 + 기본 전투 루프**로 구성하는 진행 중 구현입니다.

현재 단계의 최우선 목표는 “기본 전투 루프를 실제 플레이 가능한 형태로 만든다”입니다.

- Vite + TypeScript 기반
- API 키 없이도 화면 표시
- 규칙·판정·전투·보상·미니맵은 로컬 JS/TS에서 처리
- AI는 GM 묘사, 애매한 행동 해석, 희소한 스킬/마법 설명 생성에만 사용 예정
- 현재 AI 호출은 실제 API를 호출하지 않고 fallback/stub만 반환
- 맵은 항상 동일한 7x7 고정 맵
- 적은 항상 1명만 표시
- 버튼을 누르면 즉시 실행하지 않고 행동 큐에 쌓은 뒤, 턴 마무리에서 순서대로 실행

## 원본 자료 상태

원본 zip 업로드 필요: `source/ManRPG_v18_FINAL_병합패키지.zip`

현재 저장소에는 위 zip 파일이 없어 zip 내부의 통합본, 시트지, 플레이어 파일, 규칙 파일을 확인하지 못했습니다. 따라서 `docs/rules-extracted.md`의 규칙과 `src/rules/*`의 전투 공식은 원본 확인 전 임시 구현입니다. 추후 zip 내부 통합본과 충돌하면 통합본을 우선합니다.

## 실행 방법

```bash
npm install
npm run dev
```

개발 서버가 뜨면 터미널에 표시되는 Vite URL(기본: `http://localhost:5173`)로 접속합니다.

## 사용 가능한 스크립트

```bash
npm run dev
npm run build
npm run preview
npm run worker:check
```

## 현재 구현된 기능

- 7x7 고정 맵 표시
- 플레이어 1명과 적 1명 표시
- 플레이어/적 상태창 표시
- 현재 phase, turnOwner, 선공 표시
- 민첩 비교 기반 전투 시작 선공 결정
  - 플레이어 민첩과 적 민첩 비교
  - 같으면 플레이어 선턴
- 행동 큐
  - 이동/기본 공격/스킬/마법/아이템/방어/대기 행동 추가
  - 행동별 삭제 버튼
  - 턴 마무리 시 큐를 순서대로 실행
- 이동
  - 상하좌우 이동
  - 1~3칸 이동 선택
  - 벽, 맵 밖, 플레이어/적 점유 칸 이동 금지
- 기본 공격
  - 인접한 대상에게만 공격 가능
  - 대상 HP가 0이면 공격하지 않음
  - 민첩이 상대의 2배 이상이면 기본 공격 추가타 발생
- 적 메인턴 임시 AI
  - 적이 플레이어와 인접하면 기본 공격
  - 인접하지 않으면 플레이어 방향으로 1칸 이동
  - 이동할 수 없으면 대기
- battle-ended 처리
  - 적 HP 0: `battleResult='win'`
  - 플레이어 HP 0: `battleResult='lose'`
- 반응턴 구조 자리
  - `player-reaction`, `enemy-reaction` phase 타입은 존재
  - 실제 반응 행동은 다음 단계 TODO
  - 반응은 턴을 소모하지 않는다는 원칙을 주석/TODO에 보존
- 미니맵 요약
  - 플레이어 기준 북/동/남/서 정보
  - 적 방향과 거리
  - 근접 위협 표시
  - 계단 미구현 표시
- 전투 로그 최근 20개 표시
- 저장/불러오기 stub
  - `saveVersion: 1`
  - actionQueue 저장/복구
  - 깨진 저장 데이터는 초기 상태로 복구
- 접이식 AI 설정 패널 자리
- Cloudflare Worker stub
- AI 라우터 및 provider stub

## 아직 미구현/TODO

- 원본 zip 기반 규칙 동기화
- 반응턴 실제 구현
- 스킬/마법/아이템의 실제 효과
- 보상 규칙
- 계단/층 이동
- AI provider 실제 호출
- Cloudflare Worker 실제 relay
- 테스트 코드 추가

## 로컬 규칙 엔진 1차 구현

원본 zip 미확인 상태이므로 다음 공식은 임시 구현입니다.

- `maxHP = 체력 * 10`
- `maxMP = 레벨 * 5 + 지능 * 10`
- `mpRegen = 레벨 + 지혜 * 2`
- `basicAtk = floor((힘 + 체력) / 10) + 2`
- `rollStatCheck(effectiveStat, bonus)`
- `rollAbsoluteCheck(effectiveStat, bonus)`
- `resolveBasicAttack(actor, target)`
  - 인접 대상만 공격
  - 대상 HP 0이면 공격하지 않음
  - 민첩이 상대의 2배 이상이면 기본 공격 추가타

## AI 라우터 1차 구현

`callLLM(task, payload)`는 실제 API 호출 없이 아래 fallback 응답만 반환합니다.

```json
{
  "narration": "AI 응답 없이 로컬 규칙 결과만 반영합니다.",
  "combat_log": ["fallback:local-only"],
  "ui_tags": ["fallback"]
}
```

라우팅 우선순위는 다음 골격만 준비했습니다.

- `interpret`, `narrate`: Groq 우선
- `summarize`, `generate-skill`: Gemini 우선
- fallback: OpenRouter
