import type { LLMResponse } from '../src/ai/types';

const fallbackResponse: LLMResponse = {
  narration: 'AI 응답 없이 로컬 규칙 결과만 반영합니다.',
  combat_log: ['fallback:local-only'],
  ui_tags: ['fallback']
};

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return Response.json({ ok: true, service: 'manrpg-worker-stub' });
    }

    if (url.pathname === '/llm' && request.method === 'POST') {
      return Response.json(fallbackResponse);
    }

    return Response.json(
      {
        ok: false,
        message: 'Cloudflare Worker stub: provider 호출은 다음 단계에서 구현합니다.'
      },
      { status: 404 }
    );
  }
};
