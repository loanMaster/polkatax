import { Reward, RewardSummary } from '../../model/rewards';

export const calculateRewardSummary = (rewards: Reward[]): RewardSummary => {
  return rewards.reduce<RewardSummary>(
    (acc, reward) => {
      return {
        amount: acc.amount + reward.amount,
        value:
          acc.value === undefined || reward.value === undefined
            ? undefined
            : acc.value + reward.value,
        valueNow:
          acc.valueNow === undefined || reward.valueNow === undefined
            ? undefined
            : acc.valueNow + reward.valueNow,
      };
    },
    { amount: 0, value: 0, valueNow: 0 }
  );
};
