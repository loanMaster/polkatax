import dotenv from 'dotenv'
import {SubscanService} from "../subscan-api/subscan.service";
import {Transfer, Transfers} from "../subscan-api/transfer";
import {BlockTimeService} from "./block-time.service";
import {TokenTransfers} from "../model/token-transfer";
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

    async fetchTxAndTransfers(chainName: string, address: string, minDate: Date, maxDate?: Date): Promise<{ transactions: Transaction[], transfers: Transfers }> {
        const {blockMin} = await this.blockTimeService.estimateBlockNo(chainName, minDate.getTime())
        const {blockMax} = await this.blockTimeService.estimateBlockNo(chainName, maxDate ? maxDate.getTime() : undefined)
        const [transactions, transfers] = await Promise.all([
            this.subscanService.fetchAllExtrinsics(chainName, address, blockMin, blockMax),
            this.subscanService.fetchAllTransfers(chainName, address, blockMin, blockMax)
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
        transactions.forEach(tx => {
            const transfer: Transfer = transfers[tx.hash]
            if (transfer && !this.isRewardOrPayment(transfer)) {
                const next = {
                    hash: tx.hash,
                    block: tx.block_num,
                    date: tx.block_timestamp,
                    functionName: processFunctionName(tx.functionName),
                    contract: undefined,
                    tokens: {}
                }
                Object.keys(transfer).forEach(token => {
                    const tokenLower = token.toLowerCase()
                    if (transfer[token].amount !== 0) {
                        next.tokens[tokenLower] = {
                            amount: Math.abs(transfer[token].amount),
                            type: transfer[token].amount > 0 ? 'buy' : 'sell'
                        }
                    }
                    if (transfer[token].amount > 0 && !next.contract) {
                        next.contract = tx.callModule || ''
                    }
                })
                swaps.push(next)
            }
        })
        return swaps
    }

    async fetchSwapsAndTransfers(chainName: string, address: string, minDate: Date, maxDate?: Date): Promise<{ swaps: Swap[], payments: TokenTransfers }> {
        logger.info(`Enter fetchSwapAndTransfers for ${chainName}`)
        const isEvmAddress = address.length <= 42
        if (isEvmAddress) {
            address = await this.subscanService.mapToSubstrateAccount(chainName, address)
        }
        const {transfers, transactions} = await this.fetchTxAndTransfers(chainName, address, minDate, maxDate)
        const swaps = this._extractSwaps(transactions, transfers)
        const payments = this._extractPayments(transactions, transfers)
        logger.info(`Exit fetchSwapAndTransfers for ${chainName}`)
        return { swaps, payments }
    }
}

