import { TransferDto } from "../../blockchain/substrate/model/raw-transfer";

export interface TransferWithFiatValue extends TransferDto {
    price?: number;
    fiatValue?: number;
}