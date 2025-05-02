export interface EVMTransfer {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  contractAddress: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
}

export interface EVMTx {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  isError: string;
  txreceipt_status: string;
  functionName: string;
}

export interface TransferObjects {
  [hash: string]: TransferObject;
}

export interface TransferObject {
  to: string;
  from: string;
  hash: string;
  timestamp: number;
  block: number;
  functionName: string;
  tokens: {
    [hash: string]: number;
  };
}
