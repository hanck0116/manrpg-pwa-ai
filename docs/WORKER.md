# WORKER

## 1. Worker relay 목적

Cloudflare Worker relay는 브라우저 앱과 LLM provider 사이의 얇은 중계 계층입니다. 전투 판정, 피해, 보상, 위치, 스탯 계산은 여전히 로컬 TypeScript에서만 처리합니다.

## 2. 직접 BYOK와 Worker proxy 차이

- Direct BYOK: 브라우저가 Groq/Gemini/OpenRouter API를 직접 호출합니다.
- Worker Proxy: 브라우저가 Worker `/llm`에 요청하고, Worker가 provider API를 호출합니다.
- Relay BYOK: Worker에 운영자 secret이 없을 때 브라우저의 현재 메모리 키를 `playerKey`로 전달할 수 있습니다.

## 3. Cloudflare Worker 생성 방법

Cloudflare 대시보드에서 Workers & Pages로 이동해 새 Worker를 만들거나, Wrangler로 이 저장소의 `worker/index.ts`를 배포합니다.

## 4. Wrangler 설치/로그인

```bash
npm install -g wrangler
wrangler login
```

## 5. Secret 등록 예시

실제 키 값은 커밋하지 않습니다.

```bash
wrangler secret put GROQ_API_KEY
wrangler secret put GEMINI_API_KEY
wrangler secret put OPENROUTER_API_KEY
```

## 6. ALLOWED_ORIGIN 설정

필요하면 Worker 환경 변수에 GitHub Pages 주소를 설정합니다.

```text
ALLOWED_ORIGIN=https://hanck0116.github.io
```

설정하지 않으면 CORS는 `*`를 반환합니다.

## 7. 배포 방법

로컬 개발:

```bash
npm run worker:dev
```

타입 확인:

```bash
npm run worker:check
```

배포:

```bash
npm run worker:deploy
```

`wrangler.toml`의 기본 Worker 이름은 `manrpg-pwa-ai-relay`입니다.

GitHub Pages workflow는 `npm run worker:check`만 실행합니다. Worker 자동 배포는 Cloudflare API Token이 필요하므로 별도 단계에서 다룹니다.

## 8. 앱에서 Worker URL 입력 방법

1. 앱의 AI 설정 패널을 엽니다.
2. AI 사용을 켭니다.
3. Worker 프록시 사용을 체크합니다.
4. Worker URL에 배포된 Worker 주소를 입력합니다.
5. 연결 테스트를 누릅니다.
6. Worker 상태 확인 버튼으로 `/health` 응답을 확인합니다.

## 9. 보안 주의

- API 키를 로그에 남기지 않습니다.
- request body 전체를 로그에 남기지 않습니다.
- 프롬프트 전문과 응답 전문을 localStorage에 저장하지 않습니다.
- Worker는 규칙 판정 서버가 아니라 LLM relay입니다.
- Worker 응답 meta에는 provider, fallback 여부, 시도한 provider 목록, 문자 수 기반 추정치 같은 안전한 정보만 담습니다.
- 운영 중 로그 금지 항목: API 키, request body, prompt 전문, response 전문.

## 10. Worker meta와 errorCode

`/llm` 응답은 항상 안전한 `meta`를 포함합니다.

- `provider`: 성공 provider 또는 마지막 시도 provider
- `via`: `worker`
- `fallback`: fallback 여부
- `attemptedProviders`: 실제 시도한 provider 순서
- `errorCode`: 실패 원인을 나타내는 안전한 코드
- `estimatedInputChars`: prompt 길이
- `estimatedOutputChars`: narration과 combat_log 길이 합산

`errorCode` 목록:

- `missing-key`
- `invalid-request`
- `provider-401`
- `provider-403`
- `provider-429`
- `provider-5xx`
- `timeout`
- `network`
- `unknown`

fallback이 발생해도 게임은 로컬 규칙으로 계속 진행됩니다. Worker는 HP/MP/피해/보상/위치/스탯을 계산하거나 변경하지 않습니다.

## 11. 테스트 방법

Health:

```bash
curl https://YOUR_WORKER.workers.dev/health
```

LLM:

```bash
curl -X POST https://YOUR_WORKER.workers.dev/llm \
  -H "Content-Type: application/json" \
  -d '{"task":"narrate","provider":"groq","prompt":"짧은 테스트"}'
```

키가 없거나 provider 호출이 실패하면 fallback 응답으로 게임 진행이 계속됩니다.

## saveVersion 19 Worker/GM relay 정책

- Worker는 계속 API relay 역할만 하며 DB 저장을 하지 않습니다. 저장 상태의 소유자는 브라우저 코드입니다.
- `LLMTask`에 `gm-turn`, `enemy-action`, `compact-summary`를 추가했습니다. 기본 우선순위는 `gm-turn`/`enemy-action`은 Groq → OpenRouter → Gemini, `compact-summary`는 Gemini → OpenRouter → Groq입니다.
- `gm-turn`은 TRPG 재미를 위해 provider `max_tokens`/`maxOutputTokens`를 500까지 허용하지만, prompt 길이 제한은 6000자 이하로 유지합니다.
- API는 GM 진행/플레이어 행동 처리/적 행동 처리/묘사를 담당하지만, 전체 `GameState`, 전체 로그, 전체 적 상세를 받지 않습니다. 코드가 compact payload만 만들어 전달합니다.
- 응답은 JSON이어야 하며 코드가 `stateDeltas`만 clamp하여 반영합니다. `maxHP`, `maxMP`, `level`, 장비 구조 같은 직접 상태 덮어쓰기는 무시됩니다.
- 적은 화면에 상세 표시하지 않지만 내부적으로 항상 1명 유지합니다. 보스몹 없음, 랜덤맵 없음, 11x11 고정 맵 유지, 원본에 없는 효과 창작 금지를 Worker prompt에서도 유지합니다.
