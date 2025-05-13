export interface Transfer {
  [token: string]: {
    amount: number;
    from: string;
    to: string;
    functionName?: string;
    block: number;
    timestamp: number;
    hash: string;
  };
}

export interface Transfers {
  [hash: string]: Transfer;
}
