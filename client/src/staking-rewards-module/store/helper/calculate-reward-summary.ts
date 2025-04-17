import {  } from "app/client/src/shared-module/util/date-utils";
import { Reward, RewardSummary } from "../../model/rewards";

export const calculateRewardSummary = (rewards: Reward[]): RewardSummary => {
  const summary: RewardSummary = {
    amount: 0, value: 0, valueNow: 0
  }   
  rewards.forEach((reward: Reward) => {
    summary.amount += reward.amount;
    summary.value += reward.value;
    summary.valueNow += reward.valueNow!;
  });
  return summary;
} 