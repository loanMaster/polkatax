export interface SwappedTokens {
  [token: string]: {
    amount: number;
    value: number;
    valueNow: number | undefined;
    price: number;
    type: 'sell' | 'buy';
  };
}

export interface Swap {
  date: number;
  block: number;
  hash: string;
  contract: string;
  functionName: string;
  tokens: SwappedTokens;
}

export interface SummaryPosition {
  amount: number;
  value: number;
  valueNow: number;
}

export interface TradingSummary {
  token: string;
  priceNow: number;
  sold: SummaryPosition;
  bought: SummaryPosition;
  total: SummaryPosition;
}

export interface SwapList {
  chain: string;
  startDate: number;
  endDate: number;
  address: string;
  currency: string;
  currentPrices: { [token: string]: number };
  swaps: Swap[];
}
