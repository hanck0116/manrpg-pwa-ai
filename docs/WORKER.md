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

```bash
wrangler deploy
```

`wrangler.toml`의 기본 Worker 이름은 `manrpg-pwa-ai-relay`입니다.

## 8. 앱에서 Worker URL 입력 방법

1. 앱의 AI 설정 패널을 엽니다.
2. AI 사용을 켭니다.
3. Worker 프록시 사용을 체크합니다.
4. Worker URL에 배포된 Worker 주소를 입력합니다.
5. 연결 테스트를 누릅니다.

## 9. 보안 주의

- API 키를 로그에 남기지 않습니다.
- request body 전체를 로그에 남기지 않습니다.
- 프롬프트 전문과 응답 전문을 localStorage에 저장하지 않습니다.
- Worker는 규칙 판정 서버가 아니라 LLM relay입니다.

## 10. 테스트 방법

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
