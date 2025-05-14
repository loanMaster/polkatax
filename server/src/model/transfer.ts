export interface Transfer {
  amount: number;
  timestamp: number;
  block: number;
  fiatValue?: number;
  price?: number;
  hash?: string;
}
