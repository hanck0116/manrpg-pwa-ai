export type RewardResult = {
  gold: number;
  items: string[];
  message: string;
};

export const calculateRewardStub = (): RewardResult => ({
  gold: 0,
  items: [],
  message: '보상 규칙은 원본 zip 확인 후 구현 예정입니다.'
});
