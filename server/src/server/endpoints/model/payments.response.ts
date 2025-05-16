import { Swap } from "./swap";
import { Payment } from "./payment";

export interface PaymentsResponse {
  currentPrices: { [token: string]: number };
  swaps: Swap[];
  transfers: { [symbol: string]: { values: Payment[]; currentPrice: number } };
}
