import {Swap} from "../../common/model/swap";
import { Transfer } from "../../common/model/transfer"

export interface PaymentsResponse {
    currentPrices: { [token: string]: number };
    swaps: Swap[];
    transfers: { [symbol: string]: { values: Transfer[], currentPrice: number } };
}