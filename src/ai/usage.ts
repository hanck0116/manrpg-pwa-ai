import type { LLMTask, ProviderName } from './types';

export type AIUsageEntry = {
  id: string;
  time: number;
  task: LLMTask;
  provider: ProviderName | 'unknown';
  via: 'direct' | 'proxy' | 'worker' | 'fallback';
  fallback: boolean;
  inputChars: number;
  outputChars: number;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCostUsd: number;
};

export type AIUsageSummary = {
  totalRequests: number;
  todayRequests: number;
  fallbackCount: number;
  estimatedCostUsd: number;
  providerCounts: Record<string, { attempts: number; successes: number }>;
};

const STORAGE_KEY = 'manrpg-pwa-ai:ai-usage:v1';
const MAX_ENTRIES = 100;

const canUseLocalStorage = (): boolean => typeof localStorage !== 'undefined';

const createId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const readEntries = (): AIUsageEntry[] => {
  if (!canUseLocalStorage()) {
    return [];
  }

  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as unknown;
    return Array.isArray(parsed) ? parsed.filter(isUsageEntry) : [];
  } catch {
    return [];
  }
};

const writeEntries = (entries: AIUsageEntry[]): void => {
  if (!canUseLocalStorage()) {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
};

const isUsageEntry = (value: unknown): value is AIUsageEntry => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const entry = value as Partial<AIUsageEntry>;
  return (
    typeof entry.id === 'string' &&
    typeof entry.time === 'number' &&
    typeof entry.task === 'string' &&
    typeof entry.provider === 'string' &&
    typeof entry.via === 'string' &&
    typeof entry.fallback === 'boolean' &&
    typeof entry.inputChars === 'number' &&
    typeof entry.outputChars === 'number' &&
    typeof entry.estimatedInputTokens === 'number' &&
    typeof entry.estimatedOutputTokens === 'number' &&
    typeof entry.estimatedCostUsd === 'number'
  );
};

export const estimateTokensFromChars = (chars: number): number => Math.max(0, Math.ceil(chars / 4));

// Rough public-price estimates only. Real provider billing may differ by model, plan, region, and date.
export const estimateCostUsd = (provider: ProviderName | 'unknown', inputTokens: number, outputTokens: number): number => {
  const perMillion: Record<ProviderName | 'unknown', { input: number; output: number }> = {
    groq: { input: 0.05, output: 0.08 },
    openrouter: { input: 0.05, output: 0.2 },
    gemini: { input: 0.1, output: 0.4 },
    unknown: { input: 0, output: 0 }
  };
  const price = perMillion[provider];

  return (inputTokens / 1_000_000) * price.input + (outputTokens / 1_000_000) * price.output;
};

export const recordAIUsage = (entry: Omit<AIUsageEntry, 'id' | 'time' | 'estimatedInputTokens' | 'estimatedOutputTokens' | 'estimatedCostUsd'>): AIUsageEntry => {
  const estimatedInputTokens = estimateTokensFromChars(entry.inputChars);
  const estimatedOutputTokens = estimateTokensFromChars(entry.outputChars);
  const usageEntry: AIUsageEntry = {
    ...entry,
    id: createId(),
    time: Date.now(),
    estimatedInputTokens,
    estimatedOutputTokens,
    estimatedCostUsd: estimateCostUsd(entry.provider, estimatedInputTokens, estimatedOutputTokens)
  };

  writeEntries([...readEntries(), usageEntry]);
  return usageEntry;
};

export const getAIUsageEntries = (): AIUsageEntry[] => readEntries();

export const getAIUsageSummary = (): AIUsageSummary => {
  const entries = readEntries();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return entries.reduce<AIUsageSummary>(
    (summary, entry) => {
      const provider = entry.provider || 'unknown';
      const providerSummary = summary.providerCounts[provider] ?? { attempts: 0, successes: 0 };
      providerSummary.attempts += 1;
      if (!entry.fallback) {
        providerSummary.successes += 1;
      }

      return {
        totalRequests: summary.totalRequests + 1,
        todayRequests: summary.todayRequests + (entry.time >= today.getTime() ? 1 : 0),
        fallbackCount: summary.fallbackCount + (entry.fallback ? 1 : 0),
        estimatedCostUsd: summary.estimatedCostUsd + entry.estimatedCostUsd,
        providerCounts: {
          ...summary.providerCounts,
          [provider]: providerSummary
        }
      };
    },
    { totalRequests: 0, todayRequests: 0, fallbackCount: 0, estimatedCostUsd: 0, providerCounts: {} }
  );
};

export const clearAIUsage = (): void => {
  if (canUseLocalStorage()) {
    localStorage.removeItem(STORAGE_KEY);
  }
};
