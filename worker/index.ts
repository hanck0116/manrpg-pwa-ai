import type { LLMResponse, LLMTask, ProviderName } from '../src/ai/types';

export type Env = {
  GROQ_API_KEY?: string;
  GEMINI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  ALLOWED_ORIGIN?: string;
};

type RelayRequest = {
  provider?: ProviderName;
  task: LLMTask;
  prompt: string;
  model?: string;
  playerKey?: string;
};

const fallbackResponse: LLMResponse = {
  narration: 'AI 응답 없이 로컬 규칙 결과만 반영합니다.',
  combat_log: ['fallback:local-only'],
  ui_tags: ['fallback'],
  meta: {
    fallback: true,
    via: 'worker'
  }
};

const defaultPriority: Record<LLMTask, ProviderName[]> = {
  interpret: ['groq', 'openrouter', 'gemini'],
  narrate: ['groq', 'openrouter', 'gemini'],
  summarize: ['gemini', 'openrouter', 'groq'],
  'generate-skill': ['gemini', 'openrouter', 'groq']
};

const providerEnvKeys = {
  groq: 'GROQ_API_KEY',
  gemini: 'GEMINI_API_KEY',
  openrouter: 'OPENROUTER_API_KEY'
} as const satisfies Record<ProviderName, keyof Env>;

const defaultModels: Record<ProviderName, string> = {
  groq: 'llama-3.1-8b-instant',
  gemini: 'gemini-2.5-flash-lite',
  openrouter: 'openai/gpt-oss-20b'
};

const corsHeaders = (env: Env): HeadersInit => ({
  'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
});

const jsonResponse = (body: unknown, env: Env, init: ResponseInit = {}): Response =>
  Response.json(body, {
    ...init,
    headers: {
      ...corsHeaders(env),
      ...init.headers
    }
  });

const isTask = (value: unknown): value is LLMTask =>
  value === 'interpret' || value === 'narrate' || value === 'summarize' || value === 'generate-skill';

const isProvider = (value: unknown): value is ProviderName => value === 'groq' || value === 'gemini' || value === 'openrouter';

const normalizeResponse = (text: string): LLMResponse => {
  try {
    const parsed = JSON.parse(text) as Partial<LLMResponse>;

    return {
      narration: typeof parsed.narration === 'string' ? parsed.narration : text,
      combat_log: Array.isArray(parsed.combat_log) ? parsed.combat_log.filter((entry): entry is string => typeof entry === 'string') : [],
      ui_tags: Array.isArray(parsed.ui_tags) ? parsed.ui_tags.filter((entry): entry is string => typeof entry === 'string') : []
    };
  } catch {
    return {
      narration: text,
      combat_log: [],
      ui_tags: []
    };
  }
};

const outputChars = (response: LLMResponse): number => response.narration.length + response.combat_log.join('\n').length;

export const classifyProviderError = (error: unknown, responseStatus?: number): NonNullable<LLMResponse['meta']>['errorCode'] => {
  if (responseStatus === 401) return 'provider-401';
  if (responseStatus === 403) return 'provider-403';
  if (responseStatus === 429) return 'provider-429';
  if (responseStatus !== undefined && responseStatus >= 500) return 'provider-5xx';
  if (error instanceof Error && error.message === 'missing-key') return 'missing-key';
  if (error instanceof Error && error.message === 'invalid-request') return 'invalid-request';
  if (error instanceof DOMException && error.name === 'AbortError') return 'timeout';
  if (error instanceof Error && error.name === 'AbortError') return 'timeout';
  if (error instanceof TypeError) return 'network';
  return 'unknown';
};

const fetchWithTimeout = async (url: string, init: RequestInit, timeoutMs = 15000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

const keyForProvider = (provider: ProviderName, env: Env, playerKey?: string): string => {
  const operatorKey = env[providerEnvKeys[provider]];
  return operatorKey?.trim() || playerKey?.trim() || '';
};

const extractOpenAIText = async (response: Response): Promise<string> => {
  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('Provider response did not include content.');
  }

  return text;
};

const callOpenAICompatible = async (endpoint: string, key: string, model: string, prompt: string): Promise<LLMResponse> => {
  const response = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 300
    })
  });

  if (!response.ok) {
    throw new Error(`provider-status:${response.status}`);
  }

  return normalizeResponse(await extractOpenAIText(response));
};

const callGemini = async (key: string, model: string, prompt: string): Promise<LLMResponse> => {
  const response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300
      }
    })
  });

  if (!response.ok) {
    throw new Error(`provider-status:${response.status}`);
  }

  const data = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Provider response did not include content.');
  }

  return normalizeResponse(text);
};

const callProvider = async (provider: ProviderName, request: RelayRequest, env: Env): Promise<LLMResponse> => {
  const key = keyForProvider(provider, env, request.playerKey);

  if (!key) {
    throw new Error('missing-key');
  }

  const model = request.model || defaultModels[provider];

  if (provider === 'groq') {
    return callOpenAICompatible('https://api.groq.com/openai/v1/chat/completions', key, model, request.prompt);
  }

  if (provider === 'openrouter') {
    return callOpenAICompatible('https://openrouter.ai/api/v1/chat/completions', key, model, request.prompt);
  }

  return callGemini(key, model, request.prompt);
};

const parseRelayRequest = async (request: Request): Promise<RelayRequest | Response> => {
  let parsed: unknown;

  try {
    parsed = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, message: 'Invalid JSON body.' }), { status: 400 });
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return new Response(JSON.stringify({ ok: false, message: 'Invalid request body.' }), { status: 400 });
  }

  const body = parsed as Partial<RelayRequest>;

  if (!isTask(body.task)) {
    return new Response(JSON.stringify({ ok: false, message: 'Invalid task.' }), { status: 400 });
  }

  if (typeof body.prompt !== 'string' || body.prompt.length === 0 || body.prompt.length > 6000) {
    return new Response(JSON.stringify({ ok: false, message: 'Prompt must be a non-empty string up to 6000 characters.' }), { status: 400 });
  }

  if (body.provider !== undefined && !isProvider(body.provider)) {
    return new Response(JSON.stringify({ ok: false, message: 'Invalid provider.' }), { status: 400 });
  }

  return {
    task: body.task,
    prompt: body.prompt,
    provider: body.provider,
    model: typeof body.model === 'string' ? body.model : undefined,
    playerKey: typeof body.playerKey === 'string' ? body.playerKey : undefined
  };
};

const statusFromError = (error: unknown): number | undefined => {
  if (!(error instanceof Error) || !error.message.startsWith('provider-status:')) {
    return undefined;
  }

  const status = Number(error.message.replace('provider-status:', ''));
  return Number.isFinite(status) ? status : undefined;
};

const handleLlm = async (request: Request, env: Env): Promise<Response> => {
  const parsed = await parseRelayRequest(request);

  if (parsed instanceof Response) {
    return jsonResponse(await parsed.json(), env, { status: parsed.status });
  }

  const providers = parsed.provider ? [parsed.provider, ...defaultPriority[parsed.task].filter((provider) => provider !== parsed.provider)] : defaultPriority[parsed.task];
  const attemptedProviders: string[] = [];
  let lastProvider: ProviderName | undefined;
  let lastErrorCode: NonNullable<LLMResponse['meta']>['errorCode'] | undefined;

  for (const provider of providers) {
    attemptedProviders.push(provider);
    lastProvider = provider;
    try {
      const response = await callProvider(provider, parsed, env);
      return jsonResponse(
        {
          narration: response.narration,
          combat_log: response.combat_log,
          ui_tags: [...response.ui_tags, `provider:${provider}`],
          meta: {
            ...response.meta,
            provider,
            via: 'worker',
            fallback: false,
            attemptedProviders,
            estimatedInputChars: parsed.prompt.length,
            estimatedOutputChars: outputChars(response)
          }
        },
        env
      );
    } catch (error) {
      const errorCode = classifyProviderError(error, statusFromError(error));
      lastErrorCode = lastErrorCode && errorCode === 'missing-key' ? lastErrorCode : errorCode;
      // Provider failures fall through without logging keys, prompts, or full responses.
    }
  }

  return jsonResponse(
    {
      ...fallbackResponse,
      meta: {
        ...fallbackResponse.meta,
        provider: lastProvider,
        via: 'worker',
        fallback: true,
        attemptedProviders,
        errorCode: lastErrorCode,
        estimatedInputChars: parsed.prompt.length,
        estimatedOutputChars: outputChars(fallbackResponse)
      }
    },
    env
  );
};

export default {
  async fetch(request: Request, env: Env = {}): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    if (url.pathname === '/health' && request.method === 'GET') {
      return jsonResponse(
        {
          ok: true,
          service: 'manrpg-worker',
          version: 'relay-v1',
          providers: {
            groq: Boolean(env.GROQ_API_KEY),
            gemini: Boolean(env.GEMINI_API_KEY),
            openrouter: Boolean(env.OPENROUTER_API_KEY)
          }
        },
        env
      );
    }

    if (url.pathname === '/llm' && request.method === 'POST') {
      return handleLlm(request, env);
    }

    return jsonResponse({ ok: false, message: 'Not found.' }, env, { status: 404 });
  }
};
