import { TransferDto } from './payments-response.dto';

export interface TokenPayment extends TransferDto {
  valueNow?: number;
  isoDate: string;
}

export interface TokenPaymentsData {
  payments: TokenPayment[];
  currentPrice: number;
  summary?: TokenPaymentsSummary;
}

export interface PaymentPortfolio {
  tokens: { [token: string]: TokenPaymentsData };
  chain: string;
  address: string;
  startDate: string;
  endDate: string;
  currency: string;
}

export interface TokenPaymentsSummary {
  amount: number;
  value: number;
  valueNow: number;
}
