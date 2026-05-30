import type { LLMTask, ProviderName } from './types';

export type AIProvider = ProviderName;

export type AISettings = {
  enabled: boolean;
  useProxy: boolean;
  saveKeysOnDevice: boolean;
  primaryProvider: AIProvider;
  secondaryProvider: AIProvider;
  tertiaryProvider: AIProvider;
  groqKey: string;
  geminiKey: string;
  openrouterKey: string;
  groqModel: string;
  geminiModel: string;
  openrouterModel: string;
};

const STORAGE_KEY = 'manrpg-pwa-ai:ai-settings:v1';

export const defaultAISettings: AISettings = {
  enabled: false,
  useProxy: false,
  saveKeysOnDevice: false,
  primaryProvider: 'groq',
  secondaryProvider: 'openrouter',
  tertiaryProvider: 'gemini',
  groqKey: '',
  geminiKey: '',
  openrouterKey: '',
  groqModel: 'llama-3.1-8b-instant',
  geminiModel: 'gemini-2.5-flash-lite',
  openrouterModel: 'openai/gpt-oss-20b'
};

let memorySettings: AISettings = { ...defaultAISettings };
let storageLoaded = false;

const providerKeys = {
  groq: 'groqKey',
  gemini: 'geminiKey',
  openrouter: 'openrouterKey'
} as const satisfies Record<AIProvider, keyof AISettings>;

const uniqueProviders = (providers: AIProvider[]): AIProvider[] => providers.filter((provider, index) => providers.indexOf(provider) === index);

const canUseLocalStorage = (): boolean => typeof localStorage !== 'undefined';

const readStoredSettings = (): Partial<AISettings> => {
  if (!canUseLocalStorage()) {
    return {};
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<AISettings>) : {};
  } catch {
    return {};
  }
};

const writeStoredSettings = (settings: AISettings): void => {
  if (!canUseLocalStorage()) {
    return;
  }

  const stored: Partial<AISettings> = {
    enabled: settings.enabled,
    useProxy: settings.useProxy,
    saveKeysOnDevice: settings.saveKeysOnDevice,
    primaryProvider: settings.primaryProvider,
    secondaryProvider: settings.secondaryProvider,
    tertiaryProvider: settings.tertiaryProvider,
    groqModel: settings.groqModel,
    geminiModel: settings.geminiModel,
    openrouterModel: settings.openrouterModel
  };

  if (settings.saveKeysOnDevice) {
    stored.groqKey = settings.groqKey;
    stored.geminiKey = settings.geminiKey;
    stored.openrouterKey = settings.openrouterKey;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Browser storage may be unavailable in private or restricted contexts.
  }
};

export const getAISettings = (): AISettings => {
  if (!storageLoaded) {
    memorySettings = { ...defaultAISettings, ...readStoredSettings() };
    storageLoaded = true;
  }

  return { ...memorySettings };
};

export const setAISettings = (settings: Partial<AISettings>): AISettings => {
  const nextSettings = { ...getAISettings(), ...settings };
  memorySettings = nextSettings;
  writeStoredSettings(nextSettings);

  return { ...memorySettings };
};

export const clearAIKeys = (): AISettings => {
  const nextSettings: AISettings = {
    ...getAISettings(),
    groqKey: '',
    geminiKey: '',
    openrouterKey: ''
  };

  memorySettings = nextSettings;
  writeStoredSettings(nextSettings);

  return { ...memorySettings };
};

export const getProviderKey = (provider: AIProvider, settings: AISettings = getAISettings()): string => {
  const keyName = providerKeys[provider];
  return String(settings[keyName] ?? '');
};

export const hasProviderKey = (provider: AIProvider, settings: AISettings = getAISettings()): boolean =>
  getProviderKey(provider, settings).trim().length > 0;

export const getProviderOrder = (task: LLMTask, settings: AISettings = getAISettings()): AIProvider[] => {
  if (task === 'summarize' || task === 'generate-skill') {
    return ['gemini', 'openrouter', 'groq'];
  }

  return uniqueProviders([settings.primaryProvider, settings.secondaryProvider, settings.tertiaryProvider]);
};
