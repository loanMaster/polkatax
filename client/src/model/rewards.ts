export interface Reward extends RewardDto {
  isoDate: string;
  valueNow?: number;
}

export interface RewardSummary {
  amount: number;
  value: number;
  valueNow: number;
}

export interface Rewards {
  token: string;
  chain: string;
  address: string;
  currency: string;
  currentPrice: number;
  timeFrame: string;
  summary: RewardSummary;
  values: Reward[];
}

export interface RewardDto {
  date: number;
  block: number;
  amount: number;
  value: number;
  price?: number;
}

export interface RewardsDto {
  values: RewardDto[];
  currentPrice: number;
}
