import BigNumber from 'bignumber.js';
import fetch from 'node-fetch';
import { HttpError } from 'src/common/error/HttpError';
import { logger } from 'src/common/logger/logger';
import { Swap } from 'src/common/model/swap';
import { TokenTransfers } from 'src/common/model/token-transfer';
import { processFunctionName } from 'src/common/util/process-function-name';

export interface EVMTransfer {
    blockNumber: string
    timeStamp: string
    hash: string
    from: string
    contractAddress: string
    to: string
    value: string
    tokenName: string
    tokenSymbol: string
    tokenDecimal: string
}

export interface EVMTx {
    blockNumber: string,
    timeStamp: string,
    hash: string,
    from: string,
    to: string,
    value: string,
    isError: string,
    txreceipt_status: string,
    functionName: string,
}


interface TransferObjects {
    [hash: string]: TransferObject
}

interface TransferObject {
    to: string
    from: string
    hash: string
    timestamp: number
    block: number
    functionName: string
    tokens: {
        [hash: string]: number
    }
}

const isRewardOrPayment = (transfer: TransferObject) => {
    const received = Object.values(transfer.tokens).some(v => v > 0)
    const sent = Object.values(transfer.tokens).some(v => v < 0)
    return received && !sent || (sent && !received)
}

const normalizeTokenName = (tokenName: string) => {
    tokenName = tokenName.toLowerCase()
    if (tokenName.startsWith('xc')) {
        return tokenName.substring(2)
    }
    return tokenName
}

const mergeTransfersOfSameTx = (transfers: EVMTransfer[], walletAddress: string): TransferObjects => {
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

const extractPayments = (transactions: EVMTx[], transfers: EVMTransfer[], walletAddress: string, nativeToken: string): TokenTransfers => {
    const transfersObj = mergeTransfersOfSameTx(transfers, walletAddress)
    const rewardsAndPayments: TokenTransfers = {}

    Object.keys(transfersObj).forEach(hash => {
        const transfer = transfersObj[hash]
        const matchingTx = transactions.filter(tx => tx.hash === hash)
        matchingTx.filter(tx => Number(tx.value) !== 0 && transfer).forEach(tx => {
            transfer.tokens[nativeToken] = transfer.tokens[nativeToken] ? transfer.tokens[nativeToken] : 0
            transfer.tokens[nativeToken] += (tx.from === walletAddress ? -1 : 1)
                * new BigNumber(tx.value).dividedBy(new BigNumber(10).exponentiatedBy(18)).toNumber()
        })
        if (transfer && isRewardOrPayment(transfer)) {
            Object.keys(transfer.tokens).forEach(token => {
                if (transfer.tokens[token] !== undefined && transfer.tokens[token] !== 0) {
                    if (!rewardsAndPayments[token]) {
                        rewardsAndPayments[token] = []
                    }
                    rewardsAndPayments[token].push({
                        block: Number(transfer.block),
                        date: Number(transfer.timestamp),
                        hash,
                        from: transfer.from,
                        to: transfer.to,
                        functionName: processFunctionName(matchingTx.length > 0 && matchingTx[0]?.functionName || ''),
                        amount: transfer.tokens[token],
                    })
                }
            })
        }
    });
    (transactions || []).filter(t => !transfersObj[t.hash]).forEach(t => {
        rewardsAndPayments[nativeToken] = rewardsAndPayments[nativeToken] || []
        let matchingEntry = rewardsAndPayments[nativeToken].find(e => e.hash === t.hash)
        if (!matchingEntry) {
            matchingEntry = {
                block: Number(t.blockNumber),
                date: Number(t.timeStamp),
                hash: t.hash,
                from: t.from,
                to: t.to,
                functionName: processFunctionName(t?.functionName || ''),
                amount: 0
            }
            rewardsAndPayments[nativeToken].push(matchingEntry)
        }
        matchingEntry.amount += (t.from === walletAddress ? -1 : 1) * BigNumber(t.value).dividedBy(1e18).toNumber()
    })
    return rewardsAndPayments
}


const extractSwaps = (transactions: EVMTx[], transfers: EVMTransfer[], walletAddress: string, nativeToken: string): Swap[] => {
    const transfersObj = mergeTransfersOfSameTx(transfers, walletAddress)
    const swaps: Swap[] = []
    const txHashes = Array.from(new Set(transactions.map(tx => tx.hash)))

    txHashes.forEach(hash => {
        const transfer = transfersObj[hash]
        const matchingTx = transactions.filter(t => t.hash === hash)
        const tx = matchingTx.length > 0 ? matchingTx[0] : {blockNumber: 0, timeStamp: 0, to: '', functionName: ''}

        if (transfer) {
            matchingTx.filter(t => Number(t.value) !== 0).forEach(t => {
                transfer.tokens[nativeToken] = transfer.tokens[nativeToken] === undefined ? 0 : transfer.tokens[nativeToken]
                transfer.tokens[nativeToken] += (t.from === walletAddress ? -1 : 1)
                    * new BigNumber(t.value).dividedBy(new BigNumber(10).exponentiatedBy(18)).toNumber()
            })
        }

        if (transfer && !isRewardOrPayment(transfer)) {
            const swap: Swap = {
                block: Number(tx.blockNumber),
                date: Number(tx.timeStamp),
                hash: hash,
                contract: tx.to,
                functionName: processFunctionName(tx.functionName),
                tokens: {}
            }
            Object.keys(transfer.tokens).forEach(token => {
                token = normalizeTokenName(token)
                if (transfer.tokens[token] !== undefined && transfer.tokens[token] !== 0) {
                    swap.tokens[token] = {
                        amount: Math.abs(transfer.tokens[token]),
                        type: transfer.tokens[token] > 0 ? 'buy' : 'sell'
                    }
                }
            })
            swaps.push(swap)
        }
    })
    return swaps
}


const getNearestBlock = async (endpoint: string, apiKey: string, date: Date, closest: 'before' | 'after'): Promise<number> => {
    const response = await fetch(`${endpoint}?module=block&action=getblocknobytime&timestamp=${Math.floor(date.getTime() / 1000)}&closest=${closest}&apikey=${apiKey}`)
    let json = await response.json()
    return json.result.blockNumber || json.result
}

export const evmChainConfigs = {
    'ethereum': {
        endpoint: "https://api.etherscan.io/api",
        apiKey: process.env["ETHERSCAN_API_KEY"],
        nativeToken: 'eth'
    },
    'moonbeam': {
        endpoint: "https://api-moonbeam.moonscan.io/api",
        apiKey: process.env["MOONSCAN_API_KEY"],
        nativeToken: 'glmr'
    },
    'arbitrum-one': {
        endpoint: "https://api.arbiscan.io/api",
        apiKey: process.env["ARBISCAN_API_KEY"],
        nativeToken: 'eth'
    },
    'optimism': {
        endpoint: "https://api-optimistic.etherscan.io/api",
        apiKey: process.env["OPTIMISM_API_KEY"],
        nativeToken: 'eth'
    },
    'polygon': {
        endpoint: "https://api.polygonscan.com/api",
        apiKey: process.env["POLYSCAN_API_KEY"],
        nativeToken: 'matic'
    },
    'base': {
        endpoint: "https://api.basescan.org/api",
        apiKey: process.env["BASESCAN_API_KEY"],
        nativeToken: 'eth'
    }
}

function isToday(date) {
    const today = new Date();
    return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
    );
}

export const fetchTxAndTransfers = async (network = 'moonbeam', address: string, startDate: Date, endDate: Date): Promise<{ tx: EVMTx[], transfers: EVMTransfer[] }> => {
    const config = evmChainConfigs[network]
    const endpoint = config.endpoint
    const apiKey = config.apiKey
    const walletAdr = address.toLowerCase()
    const endBlockPromise = !endDate || isToday(endDate) ? Promise.resolve(undefined) : getNearestBlock(endpoint, apiKey, endDate, 'after')
    const [startBlock, endBlock] = await Promise.all([getNearestBlock(endpoint, apiKey, startDate, 'before'), endBlockPromise])
    if (isNaN(startBlock) || (endBlock !== undefined && isNaN(endBlock))) {
        throw new HttpError(400, "No matching block number found for start or end date. Please verify input dates.")
    }
    const endBlockQuery = endBlock ? `&{endblock=${endBlock}` : ''
    const [transferResponse, txResponse, internalTxResponse] = await Promise.all([
        fetch(`${endpoint}?module=account&action=tokentx&address=${walletAdr}&startblock=${startBlock}${endBlockQuery}&page=1&offset=0&sort=desc&sort=desc&apikey=${apiKey}`),
        fetch(`${endpoint}?module=account&action=txlist&address=${walletAdr}&startblock=${startBlock}${endBlockQuery}&page=1&offset=0&sort=desc&apikey=${apiKey}`),
        fetch(`${endpoint}?module=account&action=txlistinternal&address=${walletAdr}&startblock=${startBlock}${endBlockQuery}&page=1&offset=0&sort=desc&apikey=${apiKey}`)
    ])

    const transfers: EVMTransfer[] = (await transferResponse.json()).result
    const transactions: EVMTx[] = (await txResponse.json()).result
    const internalTransactions: EVMTx[] = (await internalTxResponse.json()).result


    if (typeof (transfers) === "string" || typeof (transactions) === "string" || typeof (internalTransactions) === "string") {
        throw new HttpError(400,
            typeof (transfers) === "string" ? transfers : typeof (transactions) === "string" ? transactions : internalTransactions as any)
    }

    let tx = []
    tx.push(...transactions)
    tx.push(...internalTransactions)
    tx = tx.filter(t => Number(t.timeStamp) >= startDate.getTime() / 1000 && Number(t.timeStamp) <= endDate.getTime() / 1000)
        .filter(t => t.isError == "0" && (t.txreceipt_status === undefined || t.txreceipt_status == '1'))
    return {tx, transfers}
}

export const fetchSwapsAndPayments = async (network = 'moonbeam', address: string, startDate: Date, endDate: Date): Promise<{ swaps: Swap[], payments: TokenTransfers }> => {
    logger.info(`Enter fetchSwapsAndPayments for ${network}`)
    const config = evmChainConfigs[network]
    const nativeToken = config.nativeToken
    const walletAdr = address.toLowerCase()
    const {tx, transfers} = await fetchTxAndTransfers(network, address, startDate, endDate)
    logger.info(`Exit fetchSwapsAndPayments for ${network}`)
    return {
        swaps: extractSwaps(tx, transfers, walletAdr, nativeToken),
        payments: extractPayments(tx, transfers, walletAdr, nativeToken)
    }
}
