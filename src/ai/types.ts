export type LLMTask = 'interpret' | 'narrate' | 'summarize' | 'generate-skill';

export type ProviderName = 'groq' | 'gemini' | 'openrouter';

export type LLMResponse = {
  narration: string;
  combat_log: string[];
  ui_tags: string[];
};

export type LLMPayload = Record<string, unknown>;

export type ProviderPriority = Partial<Record<LLMTask, ProviderName[]>>;
