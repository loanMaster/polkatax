import { BigNumber } from "bignumber.js";

export interface RawStakingReward {
  event_id: "Reward" | "Slash";
  amount: BigNumber;
  timestamp: number;
  block: number;
  hash: string;
}

export interface StakingReward {
  amount: number;
  timestamp: number;
  block: number;
  hash: string;
}
