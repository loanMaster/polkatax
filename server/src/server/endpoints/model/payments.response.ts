import { Swap } from "../../../model/swap";
import { Transfer } from "../../../model/transfer";

export interface PaymentsResponse {
  currentPrices: { [token: string]: number };
  swaps: Swap[];
  transfers: { [symbol: string]: { values: Transfer[]; currentPrice: number } };
}
