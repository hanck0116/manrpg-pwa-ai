export const renderAISettings = (): string => `
  <details class="panel ai-settings">
    <summary>AI 설정</summary>
    <div class="setting-grid">
      <label>
        Provider 우선순위
        <input type="text" value="groq → gemini → openrouter" disabled />
      </label>
      <label>
        API 키
        <input type="password" placeholder="다음 단계에서 연결" disabled />
      </label>
      <p>현재 AI 호출은 실제 API를 사용하지 않고 fallback 응답만 반환합니다.</p>
    </div>
  </details>
`;
