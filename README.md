# ManRPG PWA AI

ManRPG를 **실행 가능한 PWA 기본 골격 + 로컬 규칙 엔진 + 고정 7x7 맵 + 1인 전투 루프**로 구성하는 진행 중 구현입니다.

현재 단계의 목표는 “1인 플레이어 캐릭터 생성/스탯 분배 UI를 구현하고, 생성 완료 후 기존 1:1 전투 루프로 진입한다”입니다.

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
- 최초 실행 시 `setupMode=true`로 캐릭터 생성/스탯 분배 패널을 표시
- 생성 완료 전에는 이동/공격/스킬/마법/아이템/방어/대기/턴 마무리를 비활성화
- 버튼을 누르면 즉시 실행하지 않고 행동 큐에 쌓은 뒤, 턴 마무리에서 순서대로 실행
- 턴 마무리 한 번으로 플레이어 행동 큐 실행, 플레이어 MP 회복, 적 행동 자동 진행, 플레이어 메인턴 복귀까지 처리

## 원본 자료 상태

원본 zip 확인 완료: `source/ManRPG_v18_FINAL_병합패키지.zip`

확인한 주요 파일은 다음과 같습니다.

- `source/extracted/ManRPG_v18_FINAL_통합본.txt`
- `source/extracted/최종_Obsidian_플레이어시트_원문.md`
- `source/extracted/최종_층별_적목록.txt`
- `source/extracted/최종_적_시트_프론트매터_요약.txt`

플레이어 시트 원문에는 기본 플레이어가 `이름: 새 캐릭터`, `구분: 플레이어`, `레벨: 1`, 힘/민첩/체력/지능/지혜/외모가 모두 1인 1인 시트로 들어 있습니다. 현재 전투 상태의 플레이어는 이 1명만 사용합니다.

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
- 캐릭터 생성/스탯 분배 UI
  - 시작 레벨 1, 기본 6개 스탯 각각 1
  - 추가 분배 포인트 54를 사용해 총 스탯 60으로 생성
  - 힘/민첩/체력/지능/지혜/외모만 +/- 버튼으로 조정
  - 남은 포인트가 0일 때만 생성 완료 가능
  - 생성 완료 시 `setupMode=false`로 전환하고 전투 행동 가능
- 플레이어/적 상태창 표시
  - 기본 화면: HP, MP, 레벨, 최종 공격력, 코인, 좌표
  - 접이식 상세 스탯: 힘/민첩/체력/지능/지혜/외모, 남은 스탯 포인트, 외공, 내공, 검기 이름, 기본 공격력, 멀티캐스팅, MP 회복
- 현재 phase, turnOwner, 선공 표시
- 민첩 비교 기반 전투 시작 선공 결정
  - 플레이어 민첩과 적 민첩 비교
  - 같으면 플레이어 선턴
- 행동 큐
  - 이동/기본 공격/스킬/마법/아이템/방어/대기 행동 추가
  - 행동별 삭제 버튼
  - 플레이어 메인턴에서만 행동 추가 가능
  - `setupMode=true`인 캐릭터 생성 중에는 행동 추가/턴 마무리/적 자동 턴 진행 불가
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
  - 최종 공격력(`derived.attack`) 기반 피해 적용
  - 민첩이 상대의 2배 이상이면 기본 공격 추가타 1회 발생
  - 공격 결과에 `hits`, `damagePerHit`, `totalDamage`, 기존 호환용 `damage` 포함
  - 공격 로그에 1타/2타, 타당 피해, 총 피해 표시
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
  - `battle-ended` 상태에서만 가능
  - 스탯 분배 화면으로 돌아가지 않고 `setupMode=false`를 유지
  - 플레이어의 현재 스탯 배분은 유지하고 HP/MP를 최대치로 회복
  - 적 1명만 초기 적으로 재생성
  - 같은 7x7 고정 맵을 사용하며 보스몹/랜덤 맵/다중 적 생성 없음
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
  - `saveVersion: 3`
  - `setupMode` boolean과 `appearance`, `outerStack`, `innerStack`, `swordKi`, `multicasting`, `traits`, `coin`이 포함된 현재 구조만 유효 저장으로 취급
  - saveVersion 2 이하 데이터 또는 깨진 저장 데이터는 초기 상태로 복구
  - actionQueue 저장/복구
- 접이식 AI 설정 패널 자리
- Cloudflare Worker stub
- AI 라우터 및 provider stub

## 로컬 규칙 엔진 구현 상태

원본 통합본의 최종 파생 수치 규칙을 현재 상태 구조에 맞춰 TypeScript로 이식했습니다.

- 시작 CoreStats
  - `setupMode = true`
  - `level = 1`
  - `strength = 1`
  - `dexterity = 1`
  - `constitution = 1`
  - `intelligence = 1`
  - `wisdom = 1`
  - `appearance = 1`
  - `outerStack = 0`
  - `innerStack = 0`
  - `swordKi = 0`
  - `multicasting = 1`
  - `traits = []`
  - `coin = 0`
- 캐릭터 생성 규칙
  - 시작 레벨: 1
  - 기본 스탯: 힘/민첩/체력/지능/지혜/외모 각각 1
  - 추가 분배 포인트: 54
  - 총 시작 스탯 합계: 60
  - 총 스탯 포인트 총량: `60 + (level - 1) * 3`
  - 남은 포인트: 총 스탯 포인트 총량 - 현재 6개 스탯 합계
  - 레벨 80 미만 최대 스탯: `level + 20`; 레벨 80 이상 최대 스탯: 100
- 파생 수치
  - `totalStatPoint = 60 + (level - 1) * 3`
  - `usedStatPoint = strength + dexterity + constitution + intelligence + wisdom + appearance`
  - `remainingStatPoint = totalStatPoint - usedStatPoint`
  - `maxStat = level >= 80 ? 100 : level + 20`
  - `maxHP = floor(constitution * 10 * 1.4^outerStack)`, 최소 1
  - `maxMP = floor((level * 5 + intelligence * 10) * 1.2^innerStack + swordKiMpDelta)`, 최소 0
  - `mpRegen = floor((level + wisdom * 2) * 1.2^innerStack)`, 최소 0
  - `basicAtk = floor((strength + constitution) / 10) + 2`
  - `attack = floor(basicAtk * swordKiAtkMul * attackTraitMultiplier)`, 최소 0
  - `multi = multicasting * 2` if `traits` includes `시분할`, otherwise `multicasting`
- 검기 테이블
  - 0 없음: 공격 1배, MP 변화 0
  - 1 검기상인: 공격 1.5배, MP -50
  - 2 검기: 공격 2배, MP -150
  - 3 검사: 공격 5배, MP -300
  - 4 검강: 공격 20배, MP -700
  - 5 강기압환: 공격 50배, MP -500
  - 6 심검: 공격 50배, MP +1,000,000
- 공격 특성 배수
  - 연혼염 x1.15
  - 흑염의 영체화 x1.1
  - 헤일로 x1.25
  - 입천 x1.3
  - 앙케 라 x1.5
- 다이스
  - 일반 판정 `rollStatCheck(effectiveStat, bonus)`은 `1d[유효스탯]` 결과와 보정 합계만 반환하며 성공조건은 호출 규칙이 결정
  - 절대 판정 `rollAbsoluteCheck(effectiveStat, bonus)`은 `1d100 <= effectiveStat + bonus`
- 보상
  - 외모 기반 보상 후보 수/선택 수 `getRewardConfig(appearance)` 구현

## 아직 미구현/TODO

- 레벨업 UI
- 일반 판정의 상황별 성공조건 정리
- 심법, 심적초월, 불멸, 자기상환적 돌연변이 등 상태 필드가 더 필요한 파생 수치
- 반응턴 실제 구현
- 스킬 실제 효과 구현
- 마법/마법서 구현
- 아이템/장비 구현
- 상점 구현
- 층 클리어/보상 선택 UI
- AI provider 실제 호출
- Worker relay 구현
- 테스트 코드 추가

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
