import { Transfer } from "../../../model/transfer";

export interface StakingRewardsResponse {
  values: Transfer[];
  currentPrice: number;
  priceEndDay: number;
  token: string;
}
