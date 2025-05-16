export interface Transaction {
  hash: string;
  account: string;
  timestamp: number;
  block?: number;
  functionName?: string;
  callModule?: string;
  amount: number;
}
