export type RewardConfig = {
  offer: number;
  pick: number;
};

export type RewardResult = {
  gold: number;
  items: string[];
  message: string;
};

export const getRewardConfig = (appearance: number): RewardConfig => {
  const safeAppearance = Math.floor(appearance);

  if (safeAppearance >= 100) return { offer: 10, pick: 5 };
  if (safeAppearance >= 90) return { offer: 10, pick: 4 };
  if (safeAppearance >= 80) return { offer: 10, pick: 3 };
  if (safeAppearance >= 70) return { offer: 9, pick: 3 };
  if (safeAppearance >= 60) return { offer: 8, pick: 3 };
  if (safeAppearance >= 50) return { offer: 7, pick: 2 };
  if (safeAppearance >= 40) return { offer: 6, pick: 2 };
  if (safeAppearance >= 30) return { offer: 5, pick: 2 };
  if (safeAppearance >= 20) return { offer: 4, pick: 1 };
  if (safeAppearance >= 10) return { offer: 3, pick: 1 };

  return { offer: 2, pick: 1 };
};

export const calculateRewardStub = (): RewardResult => ({
  gold: 0,
  items: [],
  message: '보상 후보 생성과 선택 UI는 TODO입니다. 외모 기반 offer/pick 계산만 로컬 구현되어 있습니다.'
});
