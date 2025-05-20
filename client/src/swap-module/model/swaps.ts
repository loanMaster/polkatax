import {
  SwapDto,
  TokenInfo,
} from '../../transfers-module/model/payments-response.dto';

export interface SaleOrPurchase {
  symbol: string;
  amount: number;
  price?: number;
  fiatValue?: number;
  tokenId: string;
  from: string;
  to: string;
  valueNow?: number;
}

export interface Swap extends SwapDto {
  transfers: SaleOrPurchase[];
}

export interface SummaryPosition {
  amount: number;
  fiatValue?: number;
  valueNow?: number;
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
  tokens: TokenInfo;
  swaps: Swap[];
}
