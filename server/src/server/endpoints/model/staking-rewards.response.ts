import { PricedTransfer } from "./priced-transfer";

export interface StakingRewardsResponse {
  values: PricedTransfer[];
  currentPrice: number;
  priceEndDay: number;
  token: string;
}
