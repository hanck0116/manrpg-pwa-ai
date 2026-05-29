# ManRPG 규칙 추출 현황

## 상태

원본 zip 확인 완료: `source/ManRPG_v18_FINAL_병합패키지.zip`

압축 해제 위치: `source/extracted/`

확인한 주요 파일은 다음과 같습니다.

- `source/extracted/ManRPG_v18_FINAL_통합본.txt`
- `source/extracted/최종_Obsidian_플레이어시트_원문.md`
- `source/extracted/최종_층별_적목록.txt`
- `source/extracted/최종_적_시트_프론트매터_요약.txt`
- `source/extracted/충돌해결_요약.txt`
- `source/extracted/00_업로드가이드_v18_FINAL.txt`

충돌 시 `ManRPG_v18_FINAL_통합본.txt`와 최종 파일 기준 원문 부록을 우선합니다.

## 고정 전투 구조

- 플레이어는 항상 1명입니다.
- 적은 항상 1명입니다.
- 보스몹은 생성하지 않습니다.
- 맵은 항상 동일한 7x7 고정 맵입니다.
- 파티, 3인 플레이어 목록, 플레이어 선택, 플레이어 교체 구조는 사용하지 않습니다.
- AI는 판정에 관여하지 않습니다.
- 규칙·판정·전투·보상·미니맵은 로컬 TypeScript에서 처리합니다.
- AI는 GM 묘사, 애매한 행동 해석, 희소한 설명 생성에만 사용합니다.

## 확인한 1인 플레이어 시트

`최종_Obsidian_플레이어시트_원문.md`와 통합본 최종 원문 부록의 프론트매터 기준 기본 플레이어는 다음과 같습니다.

- 이름: `새 캐릭터`
- 구분: `플레이어`
- 레벨: `1`
- 포인트: `54`
- 코인: `0`
- 힘: `1`
- 민첩: `1`
- 체력: `1`
- 지능: `1`
- 지혜: `1`
- 외모: `1`
- 외공: `0`
- 내공: `0`
- 검기: `0`
- 멀티캐스팅: `1`
- 현재HP: `10`
- 현재MP: `15`

현재 `src/state/gameState.ts`는 위 값을 1인 플레이어와 단일 적의 초기 CoreStats 기준으로 사용합니다.


## 구현 완료: 캐릭터 생성/스탯 분배

이번 단계에서는 1인 플레이어의 최초 캐릭터 생성 UI를 구현했습니다. 플레이어는 항상 1명이며, 적은 항상 1명이고, 보스몹/파티/플레이어 선택/3인 구조는 만들지 않습니다.

- `GameState.setupMode`
  - `true`: 캐릭터 생성/스탯 분배 중
  - `false`: 전투 진행 중
- 시작 레벨: `1`
- 기본 스탯: 힘/민첩/체력/지능/지혜/외모 각각 `1`
- 추가 분배 포인트: `54`
- 총 시작 스탯 합계: `60`
- 조정 가능 스탯: 힘/민첩/체력/지능/지혜/외모
- 조정하지 않는 값: 외공/내공/검기/멀티캐스팅/특성/코인
- 총 스탯 포인트 총량: `60 + (level - 1) * 3`
- 사용 스탯 포인트: 힘 + 민첩 + 체력 + 지능 + 지혜 + 외모
- 남은 포인트: 총 스탯 포인트 총량 - 사용 스탯 포인트
- 스탯 최소값: `1`
- 스탯 최대값
  - 레벨 80 미만: `level + 20`
  - 레벨 80 이상: `100`
- 남은 포인트가 `0`일 때만 생성 완료할 수 있습니다.
- 생성 완료 전에는 이동/공격/스킬/마법/아이템/방어/대기/턴 마무리와 적 자동 턴을 진행하지 않습니다.
- 레벨업 UI는 아직 미구현입니다.

## 구현 완료: 최종 파생 수치 규칙 1차

`src/rules/derivedStats.ts`는 통합본의 `calc()`와 `KI` 테이블을 기준으로 다음 값을 계산합니다.

- `totalStatPoint = 60 + (level - 1) * 3`
- `usedStatPoint = strength + dexterity + constitution + intelligence + wisdom + appearance`
- `remainingStatPoint = totalStatPoint - usedStatPoint`
- `maxStat = level >= 80 ? 100 : level + 20`
- `baseHP = constitution * 10`
- `baseMP = level * 5 + intelligence * 10`
- `baseRegen = level + wisdom * 2`
- `basicAtk = floor((strength + constitution) / 10) + 2`
- `outerMultiplier = 1.4 ^ outerStack`
- `innerMultiplier = 1.2 ^ innerStack`
- `maxHP = floor(baseHP * outerMultiplier)`, 최소 1
- `maxMP = floor(baseMP * innerMultiplier + swordKiMpDelta)`, 최소 0
- `mpRegen = floor(baseRegen * innerMultiplier)`, 최소 0
- `attack = floor(basicAtk * swordKiAtkMul * attackTraitMultiplier)`, 최소 0
- `multi = multicasting * 2` if `traits` includes `시분할`, otherwise `multicasting`

### 검기 테이블

| 단계 | 이름 | 공격 배수 | MP 변화 |
| --- | --- | ---: | ---: |
| 0 | 없음 | 1 | 0 |
| 1 | 검기상인 | 1.5 | -50 |
| 2 | 검기 | 2 | -150 |
| 3 | 검사 | 5 | -300 |
| 4 | 검강 | 20 | -700 |
| 5 | 강기압환 | 50 | -500 |
| 6 | 심검 | 50 | 1,000,000 |

### 구현한 공격 특성 배수

- `연혼염`: x1.15
- `흑염의 영체화`: x1.1
- `헤일로`: x1.25
- `입천`: x1.3
- `앙케 라`: x1.5

## 구현 완료: 일반 판정/절대판정 정리

- 일반 판정 `rollStatCheck(effectiveStat, bonus)`
  - 원본 통합본에 명시된 `1d[유효스탯]`을 굴립니다.
  - 반환값은 `type`, `sides`, `roll`, `bonus`, `total`, `success?`, `note`입니다.
  - 임의 성공조건은 제거했습니다.
  - `success`는 기본적으로 `undefined`이며, 상황별 호출 규칙이 성공조건을 결정해야 합니다.
- 절대 판정 `rollAbsoluteCheck(effectiveStat, bonus)`
  - `1d100 <= effectiveStat + bonus`입니다.
  - 반환값은 `type: 'absolute'`, `roll`, `target`, `success`입니다.

## 구현 완료: 기본 공격 계산 정리

- 기본 공격은 인접 대상에게만 적용합니다.
- 기본 공격 피해는 `derived.attack`을 사용합니다.
- `derived.attack`은 검기와 구현된 공격 특성 배수를 반영한 최종 공격력입니다.
- 기본 공격 추가타는 공격자 민첩이 대상 민첩의 2배 이상일 때만 1회 발생합니다.
- 추가타는 기본 공격에만 적용합니다.
- 결과에는 `hits`, `damagePerHit`, `totalDamage`, 호환용 `damage`가 포함됩니다.

## 구현 완료: 보상 후보 수/선택 수

통합본 `rewardConfig()` 기준 외모에 따른 보상 후보 수/선택 수를 `src/rules/reward.ts`의 `getRewardConfig(appearance)`로 구현했습니다.

| 외모 | 후보 수 | 선택 수 |
| ---: | ---: | ---: |
| 100 이상 | 10 | 5 |
| 90 이상 | 10 | 4 |
| 80 이상 | 10 | 3 |
| 70 이상 | 9 | 3 |
| 60 이상 | 8 | 3 |
| 50 이상 | 7 | 2 |
| 40 이상 | 6 | 2 |
| 30 이상 | 5 | 2 |
| 20 이상 | 4 | 1 |
| 10 이상 | 3 | 1 |
| 10 미만 | 2 | 1 |

## 현재 전투 루프 구조

- 전투 시작 시 플레이어와 적의 민첩을 비교합니다.
- 더 높은 쪽이 선턴을 가져갑니다.
- 민첩이 같으면 플레이어가 선턴입니다.
- 플레이어 메인턴에서는 행동을 즉시 실행하지 않고 행동 큐에 추가합니다.
- 행동은 플레이어 메인턴에서만 추가할 수 있습니다.
- `battle-ended` 상태에서는 행동을 추가할 수 없습니다.
- 적이 이미 쓰러졌으면 기본 공격 행동을 추가할 수 없습니다.
- 플레이어가 쓰러졌으면 행동을 추가할 수 없습니다.
- 턴 마무리 시 행동 큐가 순서대로 실행됩니다.
- 각 행동 실행 전후로 전투 종료 여부를 확인합니다.
- 적 HP가 0이 되면 남은 큐를 실행하지 않고 `battle-ended` 승리 처리합니다.
- 플레이어 HP가 0이 되면 `battle-ended` 패배 처리합니다.
- 이동 중 벽/점유 칸에 막히면 해당 이동 행동은 중단하고 다음 행동으로 넘어갑니다.
- 플레이어 행동 큐 실행 후 플레이어 MP가 회복됩니다.
- 적이 살아 있으면 적 메인턴이 자동 진행됩니다.
- 적 메인턴에서는 임시 AI가 이동 또는 기본 공격을 실행합니다.
- 적 턴 종료 후 자동으로 플레이어 메인턴으로 돌아옵니다.

## 이동 임시 규칙

- 상하좌우 이동이 가능합니다.
- 이동 칸 수는 UI에서 1~3칸을 선택합니다.
- 벽으로 이동할 수 없습니다.
- 맵 밖으로 이동할 수 없습니다.
- 적이 있는 칸으로 플레이어가 이동할 수 없습니다.
- 플레이어가 있는 칸으로 적이 이동할 수 없습니다.
- 이동 실패 시 로그를 남깁니다.

## TODO: 아직 명확히 분리된 미구현 항목

- 레벨업 UI
- 일반 판정의 상황별 성공조건 정리
- `심법`, `심적초월`, `불멸`, `자기상환적 돌연변이` 등 현재 상태 필드가 더 필요한 파생 공식
- 반응턴 실제 구현
- 스킬 실제 효과 구현
- 마법/마법서 구현
- 아이템/장비 구현
- 상점/판매가 처리 구현
- 층 클리어/보상 선택 UI
- AI provider 실제 호출
- Worker relay 구현
- 테스트 코드 추가
