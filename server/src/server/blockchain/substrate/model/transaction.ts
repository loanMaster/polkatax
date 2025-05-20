export interface Transaction {
  hash: string;
  from: string;
  to?: string;
  timestamp: number;
  block?: number;
  label?: string;
  amount: number;
}
