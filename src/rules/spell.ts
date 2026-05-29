export type SpellResult = {
  ok: boolean;
  message: string;
};

export const castSpellStub = (): SpellResult => ({
  ok: false,
  message: '마법 규칙은 원본 zip 확인 후 구현 예정입니다.'
});
