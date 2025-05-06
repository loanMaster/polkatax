import { Transfer } from "./transfer";

export interface TokenTransfer extends Transfer {
  hash: string;
  from: string;
  to: string;
  functionName: string;
}

export interface TokenTransfers {
  [token: string]: TokenTransfer[];
}
