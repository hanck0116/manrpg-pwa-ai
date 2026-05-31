import { getAISettings, hasProviderKey, type AIProvider } from '../ai/settings';

let aiSettingsStatus = '';
let lastConnectionResult = '아직 연결 테스트를 실행하지 않았습니다.';
let lastFallbackStatus = '확인 전';

export const setAISettingsStatus = (status: string): void => {
  aiSettingsStatus = status;
};

export const setAIConnectionStatus = (status: string, fallbackUsed: boolean): void => {
  aiSettingsStatus = status;
  lastConnectionResult = status;
  lastFallbackStatus = fallbackUsed ? 'fallback 사용' : 'fallback 미사용';
};

const providerLabel: Record<AIProvider, string> = {
  groq: 'Groq',
  gemini: 'Gemini',
  openrouter: 'OpenRouter'
};

const escapeAttr = (value: string): string =>
  value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const renderProviderOptions = (selected: AIProvider): string =>
  (Object.keys(providerLabel) as AIProvider[])
    .map((provider) => `<option value="${provider}" ${provider === selected ? 'selected' : ''}>${providerLabel[provider]}</option>`)
    .join('');

const keyPlaceholder = (provider: AIProvider): string => (hasProviderKey(provider) ? '저장된 키 있음' : 'API 키 입력');

export const renderAISettings = (): string => {
  const settings = getAISettings();
  const savedKeyCount = (['groq', 'gemini', 'openrouter'] as AIProvider[]).filter((provider) => hasProviderKey(provider)).length;

  return `
  <details class="panel ai-settings">
    <summary>AI 설정</summary>
    <div class="ai-status-list">
      <span>현재 AI 사용 상태: <strong>${settings.enabled ? '사용' : '미사용'}</strong></span>
      <span>저장된 키: <strong>${savedKeyCount > 0 ? `${savedKeyCount}개 있음` : '없음'}</strong></span>
      <span>마지막 연결 테스트: <strong>${lastConnectionResult}</strong></span>
      <span>fallback: <strong>${lastFallbackStatus}</strong></span>
    </div>
    <div class="setting-grid">
      <label>
        AI 사용
        <input type="checkbox" data-ai-enabled ${settings.enabled ? 'checked' : ''} />
      </label>
      <label>
        1순위 Provider
        <select data-ai-primary-provider>${renderProviderOptions(settings.primaryProvider)}</select>
      </label>
      <label>
        2순위 Provider
        <select data-ai-secondary-provider>${renderProviderOptions(settings.secondaryProvider)}</select>
      </label>
      <label>
        3순위 Provider
        <select data-ai-tertiary-provider>${renderProviderOptions(settings.tertiaryProvider)}</select>
      </label>
      <label>
        Groq API 키
        <input type="password" autocomplete="off" data-ai-groq-key placeholder="${keyPlaceholder('groq')}" />
      </label>
      <label>
        Groq 모델
        <input type="text" data-ai-groq-model value="${escapeAttr(settings.groqModel)}" />
      </label>
      <label>
        Gemini API 키
        <input type="password" autocomplete="off" data-ai-gemini-key placeholder="${keyPlaceholder('gemini')}" />
      </label>
      <label>
        Gemini 모델
        <input type="text" data-ai-gemini-model value="${escapeAttr(settings.geminiModel)}" />
      </label>
      <label>
        OpenRouter API 키
        <input type="password" autocomplete="off" data-ai-openrouter-key placeholder="${keyPlaceholder('openrouter')}" />
      </label>
      <label>
        OpenRouter 모델
        <input type="text" data-ai-openrouter-model value="${escapeAttr(settings.openrouterModel)}" />
      </label>
      <label>
        이 기기에 API 키 저장
        <input type="checkbox" data-ai-save-keys ${settings.saveKeysOnDevice ? 'checked' : ''} />
      </label>
      <div class="button-row">
        <button type="button" data-ai-save-settings>설정 저장</button>
        <button type="button" data-ai-clear-keys>API 키 지우기</button>
        <button type="button" data-ai-test>연결 테스트</button>
      </div>
      <p class="muted" data-ai-status>${aiSettingsStatus}</p>
    </div>
    <details>
      <summary>자연어 행동 해석</summary>
      <p class="muted">해석 결과는 참고용이며 자동 실행되지 않습니다.</p>
      <textarea data-ai-interpret-input rows="3" placeholder="행동을 자연어로 입력"></textarea>
      <button type="button" data-ai-interpret>해석하기</button>
    </details>
  </details>
`;
};
