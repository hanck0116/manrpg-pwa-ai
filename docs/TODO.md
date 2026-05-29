# TODO

## 최우선 자료 준비

- 원본 zip 업로드 필요: `source/ManRPG_v18_FINAL_병합패키지.zip`
- 업로드 후 zip을 압축 해제하고 내부 파일 구조를 확인해야 합니다.
- zip 내부에서 통합본, 시트지, 플레이어 파일, 규칙 파일을 찾아야 합니다.
- 확인한 공식 규칙으로 `docs/rules-extracted.md`와 `src/rules/*`의 임시 구현을 갱신해야 합니다.

## 현재 완료된 1차 골격

- Vite + TypeScript 프로젝트 기반 생성
- 모바일 기준 단일 화면 UI 생성
- 7x7 고정 맵 표시
- 플레이어 1명과 적 1명 표시
- 플레이어/적 상태창 표시
- 전투 로그 영역 표시
- 행동 버튼 영역 생성
- AI 설정 접이식 패널 자리 생성
- 미니맵 요약 영역 생성
- 저장/불러오기 localStorage stub 생성
- Cloudflare Worker stub 생성
- AI 라우터 및 provider stub 생성

## 다음 구현 작업

- 원본 규칙 기반 전투 턴 순서 정리
- 이동 방향 선택 UI 확장
- 스킬/마법/아이템의 실제 로컬 처리 구현
- 보상 규칙 구현
- 미니맵 정보 갱신 규칙 보강
- 저장 데이터 버전 관리와 마이그레이션 추가
- Cloudflare Worker provider 호출 구현
- 사용자 API 키 입력/보관 정책 확정
- PWA 아이콘 자산 추가
- 정식 테스트 코드 추가
