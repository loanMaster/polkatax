export interface Reward extends RewardDto {
  date: number;
  valueNow?: number;
}

export interface RewardSummary {
  amount: number;
  value: number;
  valueNow: number;
}

export interface DailyRewards {
  [key: string]: { amount: number; value: number; valueNow: number };
}

export interface Rewards {
  token: string;
  chain: string;
  address: string;
  currency: string;
  currentPrice: number;
  timeFrame: string;
  nominationPoolId: number;
  startDate: number;
  endDate: number;
  summary: RewardSummary;
  values: Reward[];
  dailyValues: DailyRewards;
}

export interface RewardDto {
  date: number;
  block: number;
  amount: number;
  value: number;
  price?: number;
  hash: string;
}

export interface RewardsDto {
  values: RewardDto[];
  currentPrice: number;
}
