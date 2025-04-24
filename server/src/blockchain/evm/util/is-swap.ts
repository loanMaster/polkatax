import { TransferObject } from "../model/transfers"

export const isSwap = (transfer: TransferObject) => {
    const received = Object.values(transfer.tokens).some(v => v > 0)
    const sent = Object.values(transfer.tokens).some(v => v < 0)
    return received && sent
}