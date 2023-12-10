export interface Payment extends PaymentDto {
  isoDate: string;
  valueNow?: number;
}

export interface Payments {
  values: Payment[];
  currentPrice: number;
  summary: PaymentSummary | undefined;
}

export interface PaymentsList {
  tokens: { [token: string]: Payments };
  chain: string;
  address: string;
  startDate: string;
  endDate: string;
  currency: string;
}

export interface PaymentSummary {
  amount: number;
  value: number;
  valueNow: number;
}

export interface DailyPayments {
  [key: string]: { amount: number; value: number; valueNow: number };
}

export interface PaymentDto {
  date: number;
  hash: string;
  amount: number;
  value: number;
  price?: number;
}

export interface PaymentsListDto {
  [token: string]: {
    values: PaymentDto[];
    currentPrice: number;
  };
}
