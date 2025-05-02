export interface Transaction {
  hash: string;
  account: string;
  block_timestamp: number;
  block_num?: number;
  functionName?: string;
  callModule?: string;
}
