export type LLMTask = 'interpret' | 'narrate' | 'summarize' | 'generate-skill' | 'gm-turn' | 'enemy-action' | 'compact-summary';

export type ProviderName = 'groq' | 'gemini' | 'openrouter';

export type GmTurnStateDeltas = {
  playerHpDelta: number;
  playerMpDelta: number;
  enemyHpDelta: number;
  coinDelta: number;
  usedItemIds: string[];
  gainedItemNames: string[];
};

export type LLMResponse = {
  narration: string;
  combat_log: string[];
  ui_tags: string[];
  playerActionResult?: {
    kind: string;
    successLevel: string;
    summary: string;
  };
  enemyAction?: {
    kind: string;
    summary: string;
  };
  stateDeltas?: GmTurnStateDeltas;
  nextChoices?: string[];
  summaryUpdate?: string;
  meta?: {
    provider?: string;
    via?: 'direct' | 'proxy' | 'worker';
    fallback?: boolean;
    attemptedProviders?: string[];
    errorCode?: string;
    estimatedInputChars?: number;
    estimatedOutputChars?: number;
  };
};

export type LLMPayload = Record<string, unknown>;

export type ProviderPriority = Partial<Record<LLMTask, ProviderName[]>>;
