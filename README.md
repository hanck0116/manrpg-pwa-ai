# ManRPG PWA AI

ManRPG를 **실행 가능한 PWA 기본 골격 + 로컬 규칙 엔진 시작 + 고정 맵 화면**으로 구성하는 초기 구현입니다.

현재 단계에서는 완성 게임을 만들지 않고, 다음 원칙을 지킵니다.

- Vite + TypeScript 기반
- API 키 없이도 화면 표시
- 규칙·판정·전투·보상·미니맵은 로컬 JS/TS에서 처리
- AI는 GM 묘사, 애매한 행동 해석, 희소한 스킬/마법 설명 생성에만 사용 예정
- 현재 AI 호출은 실제 API를 호출하지 않고 fallback/stub만 반환
- 맵은 항상 동일한 7x7 고정 맵
- 적은 항상 1명만 표시

## 원본 자료 상태

원본 zip 업로드 필요: `source/ManRPG_v18_FINAL_병합패키지.zip`

현재 저장소에는 위 zip 파일이 없어 zip 내부의 통합본, 시트지, 플레이어 파일, 규칙 파일을 확인하지 못했습니다. 따라서 `docs/rules-extracted.md`의 규칙은 원본 확인 전 임시 구현입니다. 추후 zip 내부 통합본과 충돌하면 통합본을 우선합니다.

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

## 현재 화면 구성

- 7x7 고정 맵
- 플레이어 1명
- 적 1명
- 플레이어 상태창
- 적 상태창
- 전투 로그
- 행동 버튼
  - 이동
  - 기본 공격
  - 스킬
  - 마법
  - 아이템
  - 방어
  - 대기
  - 턴 마무리
- 접이식 AI 설정 패널 자리
- 미니맵 요약
- 저장/불러오기 stub

## 로컬 규칙 엔진 1차 구현

원본 zip 미확인 상태이므로 다음 공식은 임시 구현입니다.

- `maxHP = 체력 * 10`
- `maxMP = 레벨 * 5 + 지능 * 10`
- `mpRegen = 레벨 + 지혜 * 2`
- `basicAtk = floor((힘 + 체력) / 10) + 2`
- `rollStatCheck(effectiveStat, bonus)`
- `rollAbsoluteCheck(effectiveStat, bonus)`
- `resolveBasicAttack(actor, target)`

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
