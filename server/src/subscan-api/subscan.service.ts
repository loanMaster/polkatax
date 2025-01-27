import {MetaData} from "./meta-data";
import {Block} from "./block";
import {BigNumber} from "bignumber.js";
import {Token} from "./token";
import {HttpError} from "../error/HttpError";
import fetch from 'node-fetch';
import {Transfers} from "./transfer";
import {logger} from "../logger/logger";
import {Transaction} from "./transaction";
import {mergeListElements} from "../util/merge-list";
import {StakingReward} from "./staking-reward";

async function handleError(fetchRequest: Promise<any>) {
    const response = await fetchRequest
    if (!response.ok) {
        throw new HttpError(response.status, await response.text())
    }
    return response
}

export class SubscanService {

    constructor() {
        if (!process.env['SUBSCAN_API_KEY']) {
            throw Error('Subscan api key not found. It must be provided as env var SUBSCAN_API_KEY')
        }
    }

    get defaultHeader() {
        return {
            "Content-Type": "application/json",
            'x-api-key': process.env['SUBSCAN_API_KEY']
        }
    }

    async mapToSubstrateAccount(chainName: string, account: string): Promise<string> {
        logger.info(`Enter mapToSubstrateAccount for chain ${chainName} and account ${account}`)
        const response = await handleError(fetch(`https://${chainName}.api.subscan.io/api/v2/scan/search`, {
            method: `post`,
            headers: this.defaultHeader,
            body: JSON.stringify({ key: account })
        }))
        const info = (await response.json()).data
        const address = info?.account?.substrate_account?.address
        logger.info(`Exit mapToSubstrateAccount with address ${address}`)
        return address
    }

    async fetchMetadata(chainName: string): Promise<MetaData> {
        const response = await handleError(fetch(`https://${chainName}.api.subscan.io/api/scan/metadata`, {
            method: `post`,
            headers: this.defaultHeader,
            body: JSON.stringify({})
        }))
        const meta = (await response.json()).data
        return {avgBlockTime: Number(meta.avgBlockTime) || Number(meta.blockTime), blockNum: Number(meta.blockNum)}
    }

    async fetchToken(chainName: string): Promise<Token> {
        const response = await handleError(fetch(`https://${chainName}.api.subscan.io/api/scan/token`, {
            method: `post`,
            headers: this.defaultHeader,
            body: JSON.stringify({})
        }));
        const data = (await response.json()).data
        const nativeTokenSymbol = Object.keys(data.detail).find(symbol =>
            data.detail[symbol].asset_type === `native`
        )
        return data.detail[nativeTokenSymbol]
    }

    async fetchBlock(chainName: string, blockNum: number): Promise<Block> {
        const response = await handleError(fetch(`https://${chainName}.api.subscan.io/api/scan/block`, {
            method: `post`,
            headers: {
                "Content-Type": "application/json",
                'x-api-key': process.env['SUBSCAN_API_KEY']
            },
            body: JSON.stringify({block_num: blockNum, only_head: true})
        }));
        const body = await response.json();
        return body.data
    }

    async fetchBlockList(chainName: string, page = 0, row = 1): Promise<Block[]> {
        const response = await handleError(fetch(`https://${chainName}.api.subscan.io/api/v2/scan/blocks`, {
            method: `post`,
            headers: {
                "Content-Type": "application/json",
                'x-api-key': process.env['SUBSCAN_API_KEY']
            },
            body: JSON.stringify({page, row})
        }));
        const body = await response.json();
        return body.data.blocks
    }

    async fetchAllPoolStakingRewards(chainName: string, address: string, poolId: number): Promise<StakingReward[]> {
        return this.iterateOverPages<StakingReward>((page, count) =>
            this.fetchPoolStakingRewards(chainName, address, poolId, count, page)
        )
    }

    private async fetchPoolStakingRewards(chainName: string, address: string, pool_id: number, row: number = 100, page: number = 0): Promise<{ list: StakingReward[], hasNext: boolean }> {
        const body = JSON.stringify({
            row,
            page,
            address,
            pool_id
        })
        const response = await handleError(fetch(`https://${chainName}.api.subscan.io/api/scan/nomination_pool/rewards`, {
            method: `post`,
            headers: this.defaultHeader,
            body: body
        }));
        const responseBody = await response.json()
        return {
            list: (responseBody.data?.list || []).map(entry => {
                return {
                    event_id: entry.event_id,
                    amount: BigNumber(entry.amount),
                    block_timestamp: entry.block_timestamp,
                    block_num: entry.extrinsic_index.split('-')[0],
                    hash: entry.extrinsic_hash
                }
            }), hasNext: (responseBody.data?.list || []).length >= row
        }
    }

    private async retry<T>(query: () => Promise<T>, retries = 2, backOff = [2000, 5000]): Promise<T> {
        for (let i = 0; i < retries; i++) {
            try {
                return await query();
            } catch (e) {
                logger.warn(e);
                if (i === retries - 1) throw e;
                await new Promise(res => setTimeout(res, backOff[i]));
            }
        }
    }

    private async iterateOverPages<T>(fetchPage: (page, count) => Promise<{ list: T[], hasNext: boolean }>): Promise<T[]> {
        let page = 0
        const count = 100
        const result = []
        let intermediate: { list: T[], hasNext: boolean } = {list: [], hasNext: false}
        do {
            intermediate = await this.retry(() => fetchPage(page, count))
            result.push(...intermediate.list)
            page++
        } while (intermediate.hasNext)
        return result
    }

    fetchAllStakingRewards(chainName: string, address: string, block_min?: number, block_max?: number): Promise<StakingReward[]> {
        logger.info(`fetchAllStakingRewards for ${chainName}, address ${address}, from ${block_min} to ${block_max}`)
        return this.iterateOverPages<StakingReward>((page, count) =>
            this.fetchStakingRewards(chainName, address, count, page, true, block_min, block_max)
        )
    }

    async fetchStakingRewards(chainName: string, address: string, row: number = 100, page: number = 0, isStash: boolean, block_min?: number, block_max?: number): Promise<{ list: StakingReward[], hasNext: boolean }> {
        const body = JSON.stringify({
            row,
            page,
            address,
            'is_stash': isStash,
            block_range: block_min !== undefined && block_max !== undefined ? `${block_min}-${block_max}` : undefined
        })
        const response = await handleError(fetch(`https://${chainName}.api.subscan.io/api/scan/account/reward_slash`, {
            method: `post`,
            headers: this.defaultHeader,
            body: body
        }));
        const responseBody = await response.json()
        return {
            list: (responseBody.data?.list || []).map(entry => {
                return {
                    event_id: entry.event_id,
                    amount: BigNumber(entry.amount),
                    block_timestamp: entry.block_timestamp,
                    block_num: entry.block_num,
                    hash: entry.extrinsic_hash
                }
            }), hasNext: (responseBody.data?.list || []).length >= row
        }
    }

    fetchAllExtrinsics(chainName: string, address: string, block_min?: number, block_max?: number): Promise<Transaction[]> {
        logger.info(`fetchAllExtrinsics for ${chainName} and address ${address}`)
        const fetchExtrinsics = async (chainName: string, address: string, row: number = 100, page: number = 0, block_min?: number, block_max?: number): Promise<{ list: Transaction[], hasNext: boolean }> => {
            const body = JSON.stringify({
                row,
                page,
                address,
                success: true,
                block_range: block_min !== undefined && block_max !== undefined ? `${block_min}-${block_max}` : undefined
            })
            const response = await handleError(fetch(`https://${chainName}.api.subscan.io/api/v2/scan/extrinsics`, {
                method: `post`,
                headers: this.defaultHeader,
                body: body
            }));
            const responseBody = await response.json()
            return {
                list: (responseBody.data?.extrinsics || []).map(entry => {
                    return {
                        hash: entry.extrinsic_hash,
                        account: entry.account_display.address,
                        block_timestamp: entry.block_timestamp,
                        block_num: entry.block_num,
                        functionName: entry.call_module_function,
                        callModule: entry.call_module
                    }
                }), hasNext: (responseBody.data?.extrinsics || []).length >= row
            }
        }
        const result = this.iterateOverPages<Transaction>((page, count) =>
                fetchExtrinsics(chainName, address, count, page, block_min, block_max))
        logger.info(`Exit fetchAllExtrinsics for ${chainName} and address ${address}`)
        return result
    }

    async fetchAccounts(address: string, chainName: string): Promise<string[]> {
        const body = JSON.stringify({
            address: [address],
            row: 100
        })
        const response = await handleError(fetch(`https://${chainName}.api.subscan.io/api/v2/scan/accounts`, {
            method: `post`,
            headers: this.defaultHeader,
            body: body
        }));
        const json = await response.json()
        return (json.data.list && json.data.list.length > 0 ? json.data.list : [{ address }]).map(entry => entry.address)
    }

    async fetchAllTransfers(chainName: string, account: string, block_min?: number, block_max?: number): Promise<Transfers> {
        logger.info(`fetchAllTransfers for ${chainName} and account ${account}`)
        const addresses = await this.fetchAccounts(account, chainName)
        const isMyAccount = (address: string) => addresses.indexOf(address) > -1
        const fetchTransfers = async (chainName: string, account: string, row: number = 100, page: number = 0, block_min?: number, block_max?: number): Promise<{ list: Transfers[], hasNext: boolean }> => {
            const body = JSON.stringify({
                row,
                page,
                address: account,
                success: true,
                block_range: block_min !== undefined && block_max !== undefined ? `${block_min}-${block_max}` : undefined
            })
            const response = await handleError(fetch(`https://${chainName}.api.subscan.io/api/v2/scan/transfers`, {
                method: `post`,
                headers: this.defaultHeader,
                body: body
            }));
            const responseBody = await response.json()
            const transfers: any = {};
            (responseBody.data?.transfers || []).forEach(entry => {
                const otherAddress = isMyAccount(entry.from) ? entry.to : entry.from
                if (!transfers[entry.hash]) {
                    transfers[entry.hash] = {}
                }
                if (!transfers[entry.hash][entry.asset_symbol]) {
                    transfers[entry.hash][entry.asset_symbol] = { amount: 0 }
                }
                transfers[entry.hash][entry.asset_symbol].functionName = entry.module
                if (isMyAccount(entry.to)) {
                    transfers[entry.hash][entry.asset_symbol].amount += Number(entry.amount)
                } else if (isMyAccount(entry.from)) {
                    transfers[entry.hash][entry.asset_symbol].amount -= Number(entry.amount)
                } else {
                    console.warn('no match for transfer!')
                }
                if (transfers[entry.hash][entry.asset_symbol].amount > 0) {
                    transfers[entry.hash][entry.asset_symbol].to = account
                    transfers[entry.hash][entry.asset_symbol].from = otherAddress
                } else {
                    transfers[entry.hash][entry.asset_symbol].from = account
                    transfers[entry.hash][entry.asset_symbol].to = otherAddress
                }
                transfers[entry.hash][entry.asset_symbol].block = entry.block_num
                transfers[entry.hash][entry.asset_symbol].timestamp = entry.block_timestamp
                transfers[entry.hash][entry.asset_symbol].hash = entry.hash
            })
            return {list: [transfers], hasNext: (responseBody.data?.transfers || []).length >= row}
        }
        const result = mergeListElements(await this.iterateOverPages<any>((page, count) =>
                fetchTransfers(chainName, account, count, page, block_min, block_max)))
        logger.info(`Exit fetchAllTransfers for ${chainName} and account ${account}`)
        return result
    }
}

