export interface PaymentsResponseDto {
  currentPrices: { [token: string]: number };
  swaps: SwapDto[];
  transfers: {
    [symbol: string]: { values: TransferDto[]; currentPrice: number };
  };
}

export interface TransferDto {
  amount: number;
  date: number;
  block: number;
  value?: number;
  price?: number;
  hash?: string;
}

export interface SwapDto {
  hash: string;
  block: number;
  date: number;
  functionName: string;
  contract: string;
  tokens: {
    [token: string]: {
      amount: number;
      type: 'sell' | 'buy';
      price?: number;
      value?: number;
    };
  };
}
