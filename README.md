# ManRPG PWA AI

ManRPG를 **실행 가능한 PWA 기본 골격 + 로컬 규칙 엔진 + 고정 7x7 맵 + 1인 전투 루프**로 구성하는 진행 중 구현입니다.

현재 단계의 최우선 목표는 “플레이어 1명과 적 1명의 기본 전투 루프를 실제 플레이 가능한 형태로 고정한다”입니다.

- Vite + TypeScript 기반
- API 키 없이도 화면 표시
- 규칙·판정·전투·보상·미니맵은 로컬 JS/TS에서 처리
- AI는 GM 묘사, 애매한 행동 해석, 희소한 스킬/마법 설명 생성에만 사용 예정
- 현재 AI 호출은 실제 API를 호출하지 않고 fallback/stub만 반환
- 플레이어는 항상 1명
- 적은 항상 1명
- 보스몹 없음
- 맵은 항상 동일한 7x7 고정 맵
- 3인/파티/플레이어 선택 구조 없음
- 버튼을 누르면 즉시 실행하지 않고 행동 큐에 쌓은 뒤, 턴 마무리에서 순서대로 실행
- 턴 마무리 한 번으로 플레이어 행동 큐 실행, 플레이어 MP 회복, 적 행동 자동 진행, 플레이어 메인턴 복귀까지 처리

## 원본 자료 상태

원본 zip 확인 완료: `source/ManRPG_v18_FINAL_병합패키지.zip`

확인한 주요 파일은 다음과 같습니다.

- `source/extracted/ManRPG_v18_FINAL_통합본.txt`
- `source/extracted/최종_Obsidian_플레이어시트_원문.md`
- `source/extracted/최종_층별_적목록.txt`
- `source/extracted/최종_적_시트_프론트매터_요약.txt`

플레이어 시트 원문에는 기본 플레이어가 `이름: 새 캐릭터`, `구분: 플레이어`, `레벨: 1`, 힘/민첩/체력/지능/지혜가 모두 1인 1인 시트로 들어 있습니다. 현재 전투 상태의 플레이어는 이 1명만 사용합니다.

다만 현재 `src/rules/*`의 세부 전투 공식은 앱 골격을 유지하기 위한 임시 구현입니다. 원본 통합본의 세부 공식과 충돌하면 통합본을 우선합니다.

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
  - 플레이어 메인턴에서만 행동 추가 가능
  - 전투 종료/플레이어 사망/적 사망 공격 추가 방지
  - 턴 마무리 시 큐를 순서대로 실행
  - 전투 종료가 발생하면 남은 큐는 실행하지 않음
- 이동
  - 상하좌우 이동
  - 1~3칸 이동 선택
  - 벽, 맵 밖, 플레이어/적 점유 칸 이동 금지
  - 이동 중 막히면 해당 이동 행동을 중단하고 다음 행동으로 진행
- 기본 공격
  - 인접한 대상에게만 공격 가능
  - 대상 HP가 0이면 공격하지 않음
  - 민첩이 상대의 2배 이상이면 기본 공격 추가타 발생
  - 공격 로그에 1타/2타 여부 표시
- 적 메인턴 임시 AI
  - 적이 플레이어와 인접하면 기본 공격
  - 인접하지 않으면 플레이어 방향으로 1칸 이동
  - 이동할 수 없으면 대기
  - 플레이어 턴 마무리 후 자동 실행
  - 적 행동 후 자동으로 `player-main` 복귀
- battle-ended 처리
  - 적 HP 0: `battleResult='win'`
  - 플레이어 HP 0: `battleResult='lose'`
- 새 전투 시작
  - `battle-ended` 상태에서 같은 7x7 고정 맵으로 플레이어 1명과 적 1명을 초기화
  - 보스몹/랜덤 맵/다중 적 생성 없음
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

- 원본 zip 확인 결과를 세부 로컬 규칙에 완전히 동기화
- 1인 플레이어 시트 동기화 고도화
- 반응턴 실제 구현
- 스킬 실제 효과 구현
- 마법/아이템/장비 구현
- 보상/상점 구현
- AI provider 실제 호출
- Worker relay 구현
- 테스트 코드 추가

## 로컬 규칙 엔진 1차 구현

원본 zip은 확인했지만 세부 공식 동기화 전이므로 다음 공식은 임시 구현입니다.

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
  - 결과에 `hits`를 포함하고 로그에 1타/2타를 표시

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
