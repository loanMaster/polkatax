import BigNumber from "bignumber.js"
import { EVMTransfer, TransferObjects } from "../model/transfers"
import { normalizeTokenName } from "./normalize-token-name"

export const mergeTransfersOfSameTx = (transfers: EVMTransfer[], walletAddress: string): TransferObjects => {
    const transfersObj: TransferObjects = {}
    transfers.forEach(t => {
        const tokenSymbol = normalizeTokenName(t.tokenSymbol)
        const value = new BigNumber(t.value).dividedBy(new BigNumber(10).exponentiatedBy(Number(t.tokenDecimal))).toNumber()
        const valueUpdate = (t.from === walletAddress) ? -value : (t.to === walletAddress) ? value : 0
        if (!transfersObj[t.hash]) {
            transfersObj[t.hash] = {
                from: t.from,
                to: t.to,
                block: Number(t.blockNumber),
                hash: t.hash,
                functionName: '',
                timestamp: Number(t.timeStamp),
                tokens: {}
            }
        }
        transfersObj[t.hash].tokens[tokenSymbol] =
            transfersObj[t.hash].tokens[tokenSymbol] === undefined ? valueUpdate : transfersObj[t.hash].tokens[tokenSymbol] + valueUpdate
    })
    return transfersObj
}