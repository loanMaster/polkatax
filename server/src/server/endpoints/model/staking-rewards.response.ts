import { PricedStakingReward } from "./priced-staking-reward";

export interface StakingRewardsResponse {
  values: PricedStakingReward[];
  currentPrice: number;
  priceEndDay: number;
  token: string;
}
