import { Transaction } from "../../blockchain/substrate/model/transaction";

export interface TxWithFiatValue extends Transaction {
    price?: number;
    fiatValue?: number;
}