import dotenv from 'dotenv'
import {SubscanService} from "../subscan-api/subscan.service";
import {Transfer, Transfers} from "../subscan-api/transfer";
import {BlockTimeService} from "./block-time.service";
import {TokenTransfer, TokenTransfers} from "../model/token-transfer";
import {Transaction} from "../subscan-api/transaction";
import {Swap} from "../model/swap";
import {processFunctionName} from "../util/process-function-name";
import {logger} from "../logger/logger";

dotenv.config({path: __dirname + '/../.env'})

export class DotTransferService {

    constructor(private blockTimeService: BlockTimeService, private subscanService: SubscanService) {
    }

    private isRewardOrPayment(transfer: Transfer) {
        const received = Object.values(transfer).some((v: any) => v.amount > 0)
        const sent = Object.values(transfer).some((v: any) => v.amount < 0)
        return (received && !sent) || (!received && sent)
    }

    async fetchTxAndTransfers(chainName: string, address: string, blockMin: number, blockMax: number, evm = false): Promise<{ transactions: Transaction[], transfers: Transfers }> {
        const [transactions, transfers] = await Promise.all([
            this.subscanService.fetchAllTx(chainName, address, blockMin, blockMax, evm),
            this.subscanService.fetchAllTransfers(chainName, address, blockMin, blockMax, evm)
        ])
        return {transactions, transfers}
    }

    _extractPayments(transactions: Transaction[], transfers: Transfers): TokenTransfers {
        const rewardsAndPayments: TokenTransfers = {}
        Object.keys(transfers).forEach(hash => {
            const transfer: Transfer = transfers[hash]
            if (transfer && this.isRewardOrPayment(transfer)) {
                Object.keys(transfer).forEach(token => {
                    const tx = transactions.find(tx => tx.hash === hash)
                    const tokenLower = token.toLowerCase()
                    if (transfer[token].amount !== 0) {
                        if (!rewardsAndPayments[tokenLower]) {
                            rewardsAndPayments[tokenLower] = []
                        }
                        rewardsAndPayments[tokenLower].push({
                            hash: hash,
                            from: transfer[token].from,
                            to: transfer[token].to,
                            block: transfer[token].block,
                            date: transfer[token].timestamp,
                            amount: transfer[token].amount,
                            functionName: processFunctionName(tx?.functionName || transfer[token].functionName)
                        })
                    }
                })
            }
        })
        return rewardsAndPayments
    }

    _extractSwaps(transactions: Transaction[], transfers: Transfers): Swap[] {
        const swaps: any = []
        Object.keys(transfers).forEach(hash => {
            const tx = transactions.find(tx => tx.hash === hash)
            const transfer: Transfer = transfers[hash]
            if (transfer && !this.isRewardOrPayment(transfer)) {
                let swap = undefined
                Object.keys(transfer).forEach(token => {
                    swap = swap || {
                        hash: hash,
                        block: transfer[token].block || tx?.block_num,
                        date: transfer[token].timestamp || tx?.block_timestamp,
                        functionName: processFunctionName(transfer[token].functionName),
                        contract: undefined,
                        tokens: {}
                    }
                    const tokenLower = token.toLowerCase()
                    if (transfer[token].amount !== 0) {
                        swap.tokens[tokenLower] = {
                            amount: Math.abs(transfer[token].amount),
                            type: transfer[token].amount > 0 ? 'buy' : 'sell'
                        }
                    }
                    if (transfer[token].amount > 0 && !swap.contract) {
                        swap.contract = tx?.callModule || ''
                    }
                })
                swaps.push(swap)
            }
        })
        return swaps
    }

    _merge(target: Transfers, source: Transfers) {
        Object.keys(source).forEach(hash => {
            if (!target[hash]) {
                target[hash] = source[hash]
            } else {
                Object.keys(source[hash]).forEach(token => {
                    if (!target[hash][token]) {
                        target[hash][token] = source[hash][token]
                    } else {
                        target[hash][token].amount += source[hash][token].amount
                    }
                })
            }
        })
        return target
    }

    async fetchSwapsAndTransfers(chainName: string, address: string, minDate: Date, maxDate?: Date): Promise<{ swaps: Swap[], payments: TokenTransfers }> {
        logger.info(`Enter fetchSwapAndTransfers for ${chainName}`)
        const isEvmAddress = address.length <= 42
        let evmAddress: string = undefined

        if (isEvmAddress) {
            evmAddress = address
            address = await this.subscanService.mapToSubstrateAccount(chainName, address)
        }
        const {blockMin, blockMax} = await this.blockTimeService.getMinMaxBlock(chainName, minDate.getTime(), maxDate ? maxDate.getTime() : undefined)
        let {transfers, transactions} = await this.fetchTxAndTransfers(chainName, address, blockMin, blockMax, false)

        if (evmAddress) {
            const result = await this.fetchTxAndTransfers(chainName, evmAddress, blockMin, blockMax, true)
            this._merge(transfers, result.transfers)
            transactions = transactions.concat(result.transactions)
        }

        const swaps = this._extractSwaps(transactions, transfers)
        const filtered = swaps.filter(s => (
            s.date * 1000 >= minDate.getTime() && (!maxDate || s.date * 1000 <= maxDate.getTime())
        ))
        const payments = this._extractPayments(transactions, transfers)
        Object.keys(payments).forEach(token => {
            payments[token] = payments[token].filter((transfer: TokenTransfer) => (
                transfer.date * 1000 >= minDate.getTime() && (!maxDate || transfer.date * 1000 <= maxDate.getTime())
            ))
            if (payments[token].length == 0) {
                delete payments[token]
            }
        })
        logger.info(`Exit fetchSwapAndTransfers for ${chainName}`)
        return {swaps: filtered, payments}
    }
}

