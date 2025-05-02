export interface Swap {
  hash: string;
  block: number;
  date: number;
  functionName: string;
  contract: string;
  tokens: {
    [token: string]: {
      amount: number;
      type: "sell" | "buy";
      price?: number;
      value?: number;
    };
  };
}
