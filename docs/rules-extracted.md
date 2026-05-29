# ManRPG 규칙 추출 현황

## 상태

원본 zip 미확인으로 규칙 추출 대기

`source/ManRPG_v18_FINAL_병합패키지.zip` 파일이 아직 없어 zip 내부의 통합본, 시트지, 플레이어 파일, 규칙 파일을 확인하지 못했습니다.

## 1차 임시 로컬 규칙

아래 규칙은 원본 zip 업로드 전까지 실행 가능한 골격을 만들기 위한 임시 구현입니다. 추후 zip 내부 통합본과 충돌하면 통합본을 우선합니다.

- `maxHP = 체력 * 10`
- `maxMP = 레벨 * 5 + 지능 * 10`
- `mpRegen = 레벨 + 지혜 * 2`
- `basicAtk = floor((힘 + 체력) / 10) + 2`
- 일반 판정 `rollStatCheck(effectiveStat, bonus)`는 임시 구현입니다.
- 절대 판정 `rollAbsoluteCheck(effectiveStat, bonus)`는 `1d100 <= effectiveStat + bonus` 방식입니다.
- 기본 공격 `resolveBasicAttack(actor, target)`은 인접한 대상에게 `basicAtk` 피해를 주는 임시 구현입니다.

## 다음 확인 필요 자료

- source/ManRPG_v18_FINAL_병합패키지.zip 업로드 필요
- zip 내부 통합본 확인 필요
- zip 내부 시트지 확인 필요
- zip 내부 플레이어 파일 확인 필요
- zip 내부 규칙 파일 확인 필요
