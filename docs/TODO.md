# TODO

## 완료

- [x] 원본 zip 확인: `source/ManRPG_v18_FINAL_병합패키지.zip`
- [x] 원본 통합본 확인: `source/extracted/ManRPG_v18_FINAL_통합본.txt`
- [x] 플레이어 1명/적 1명/보스 없음/고정 11x11 맵 구조 고정
- [x] 11x11 고정 맵 확대
- [x] CoreStats에 외모, 외공, 내공, 검기, 멀티캐스팅, 특성, 코인 추가
- [x] 원본 통합본 기준 파생 수치 1차 구현
- [x] 일반 판정의 임의 성공조건 제거
- [x] 외모 기반 보상 후보 수/선택 수 구현
- [x] 캐릭터 생성/스탯 분배 UI
- [x] 총 시작 스탯 60/추가 포인트 54 적용
- [x] 층 클리어/보상 선택 UI
- [x] 외모 기반 보상 후보 생성
- [x] 보상 선택 후 코인/인벤토리 반영
- [x] 5Lv 플러스 적용
- [x] 레벨업 UI
- [x] 레벨업 스탯 분배
- [x] 보상 아이템 사용 효과 일부
- [x] 마법서 습득 판정
- [x] 마법서 층당 1회 무료/이후 1코인 시도 규칙
- [x] 인벤토리 사용/판매 UI
- [x] 보유 마법 목록
- [x] 마법 전투 시전 1차 구현
- [x] 마법 MP 소모/위력 계산
- [x] 보유 마법 행동 큐 추가 UI
- [x] 전투 중 아이템 행동 구조
- [x] 상점 구현 1차
- [x] 반응행동 1차 구현
- [x] 테스트 코드 추가
- [x] 사용자 표시 UI/로그 한국어 정리
- [x] 상점 상품명 원본 한국어명 정리
- [x] 마법 분류 원본 목록 기반 정리
- [x] 방어 행동 유지/해제 버그 수정
- [x] RewardItem 타입 원본 makeItem 기준 확장
- [x] magicTicket random 사용 1차 구현
- [x] magicTicket select 선택 UI
- [x] choice 선택권 UI 1차
- [x] choice 선택권 실제 효과 1차
- [x] choice 제한 실패 시 pendingChoice 유지
- [x] trait item 사용 1차
- [x] 스킬 구조 1차 구현
- [x] 보유 스킬 UI 및 행동 큐 연결
- [x] 스킬 전투 사용 1차 구현
- [x] 스킬 초기화권 1차 구현
- [x] 스킬 제작 필드 확장 1차
- [x] 일반 판정 시스템 1차
- [x] 스킬/기술 판정 연결 1차
- [x] 패시브 스킬 스탯 반영 1차
- [x] 반응 스킬 연결 1차
- [x] 기술 제작 출처 해금 1차
- [x] 기술 제작 시스템 1차
- [x] 기술 전투 사용 1차
- [x] 심법/심적초월 파생 수치 반영
- [x] 장비 구조 1차 구현
- [x] 장비 착용/해제 UI
- [x] 장비 보너스 파생 수치 반영 1차
- [x] AI API 1차 구현: 브라우저 직접 BYOK 호출, 수동 GM 묘사/자연어 해석, fallback 유지
- [x] AI 자동 GM 서술
- [x] GitHub Pages 배포 설정
- [x] 실험/디버그 패널
- [x] TESTING.md 작성
- [x] 모바일 실험 UI 정리
- [x] 모바일 탭 UI 1차
- [x] Worker relay 1차 구현
- [x] Worker URL 설정 UI
- [x] docs/WORKER.md 작성
- [x] Worker 운영 안정화 1차
- [x] Worker health 확인 UI
- [x] AI 사용량/비용 추정 UI
- [x] worker:check CI 연결
- [x] Worker safe meta/errorCode 응답
- [x] fallback 원인 표시
- [x] Worker meta 테스트 보강
- [x] 천사의 시련 UI 실제 구현
- [x] 천사의 시련 보상 지급 1차
- [x] saveVersion 2 반영
- [x] saveVersion 3 반영
- [x] saveVersion 4 반영
- [x] saveVersion 5 반영
- [x] saveVersion 6 반영
- [x] saveVersion 8 반영
- [x] saveVersion 9 반영
- [x] saveVersion 10 반영
- [x] saveVersion 11 반영
- [x] saveVersion 13 반영
- [x] saveVersion 15 반영
- [x] saveVersion 17

## 남은 TODO

- [ ] 일반 판정의 상황별 성공조건 정밀화
- [ ] 기술 판정 실패 시 자원 소모 여부 원본 확인
- [ ] 스킬 패시브 효과 종류 확장
- [ ] 마법 특수 효과/상태이상 구현
- [ ] 임모탈 평선 발동/해제
- [ ] 원영/정령왕/빙백연혼 실제 효과 정밀화
- [ ] 장비 원본 목록/가격 정밀화
- [ ] 전투 중 실제 소모 아이템 추가
- [ ] Worker 자동 배포 workflow
- [ ] provider별 실제 사용량 API 연동
- [ ] UI 모바일 최종 정리
- [ ] 배포 후 버그 수정


## 완료됨: saveVersion 17 헤일로 9종 1차 구현

- [x] 헤일로 9종 선택 구조
- [x] 사탄 헤일로 패시브 1차
- [x] 증폭 헤일로 1차
- [x] 소멸 헤일로 1차
- [x] 탄생 헤일로 1차
- [x] 결합 헤일로 1차
- [x] 분해 헤일로 1차
- [x] 존재 헤일로 1차
- [x] 성취 헤일로 1차
- [x] 욕망 헤일로 1차
- [x] saveVersion 17

## 남은 TODO: 헤일로 이후 정밀화

- [ ] 존재 헤일로 상황별 판정 정밀화
- [ ] 욕망 결과의 실제 규칙 반영
- [ ] 성취 observedSpells 기록처 확장
- [ ] 분해 대상 기술/마법 적 행동 구현 시 연동
- [ ] 증폭 대상별 세부 처리 정밀화
- [ ] 일반 판정의 상황별 성공조건 정밀화
- [ ] 마법 특수 효과/상태이상 세부 구현
- [ ] 임모탈 평선 실제 효과 정밀화
- [ ] 원영/정령왕/빙백연혼 실제 효과 정밀화
- [ ] 장비 원본 목록/가격 정밀화
- [ ] 전투 중 실제 소모 아이템 추가
- [ ] Worker 자동 배포 workflow
- [ ] UI 모바일 최종 정리
- [ ] 배포 후 버그 수정
