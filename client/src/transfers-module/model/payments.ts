import { TokenInfo, TransferDto } from './payments-response.dto';

export interface TokenPayment extends TransferDto {
  valueNow?: number;
  isoDate: string;
}

export interface TokenPaymentsData {
  payments: TokenPayment[];
  currentPrice?: number;
  summary?: TokenPaymentsSummary;
}

export interface PaymentPortfolio {
  transfers: TokenPayment[];
  chain: string;
  address: string;
  startDate: string;
  endDate: string;
  currency: string;
  tokens: TokenInfo;
}

export interface TokenPaymentsSummary {
  amount: number;
  fiatValue: number;
  valueNow: number;
}
