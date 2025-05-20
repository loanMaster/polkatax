export interface PaymentsResponseDto {
  swaps: SwapDto[];
  transfers: TransferDto[];
  tokens: TokenInfo;
}

export interface TransferDto {
  symbol: string;
  amount: number;
  timestamp: number;
  block: number;
  fiatValue?: number;
  price?: number;
  hash?: string;
  tokenId: string;
  label?: string;
}

export type TokenInfo = Record<
  string,
  { symbol: string; coingeckoId?: string; latestPrice?: number }
>;

export interface SwapDto {
  hash: string;
  block: number;
  timestamp: number;
  label: string;
  contract: string;
  transfers: {
    symbol: string;
    amount: number;
    price?: number;
    fiatValue?: number;
    tokenId: string;
    from: string;
    to: string;
  }[];
}
