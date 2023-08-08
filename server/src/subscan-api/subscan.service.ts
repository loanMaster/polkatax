import {MetaData} from "./meta-data";
import {Reward} from "./reward";
import {Block} from "./block";
import {BigNumber} from "bignumber.js";
import {Token} from "./token";
import {HttpError} from "../error/HttpError";
import fetch from 'node-fetch';

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

    async fetchMetadata (chainName: string): Promise<MetaData> {
        const response = await handleError(fetch(`https://${chainName}.api.subscan.io/api/scan/metadata`, {
            method: `post`,
            headers: this.defaultHeader,
            body: JSON.stringify({})
        }))
        const meta = (await response.json()).data
        return {avgBlockTime: Number(meta.avgBlockTime) || Number(meta.blockTime), blockNum: Number(meta.blockNum)}
    }

    async fetchToken (chainName: string): Promise<Token> {
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

    async fetchAllPoolStakingRewards(chainName: string, address: string, poolId: number): Promise<Reward[]> {
        return this.iterateOverPages<Reward>((page, count) =>
            this.fetchPoolStakingRewards(chainName, address, poolId, count, page)
        )
    }

    private async fetchPoolId(chainName: string, address: string): Promise<number | undefined> {
        const body = JSON.stringify({ address })
        const response = await handleError(fetch(`https://${chainName}.api.subscan.io/api/scan/nomination_pool/pool/member/vote`, {
            method: `post`,
            headers: this.defaultHeader,
            body: body
        }));
        const jsonBody = await response.json()
        return jsonBody.data?.pool_id
    }

    private async fetchPoolStakingRewards(chainName: string, address: string, pool_id: number, row: number = 100, page: number = 0): Promise<Reward[]> {
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
        return (responseBody.data?.list || []).map(entry => {
            return {
                event_id: entry.event_id,
                amount: BigNumber(entry.amount),
                block_timestamp: entry.block_timestamp,
                block_num: entry.extrinsic_index.split('-')[0],
            }
        })
    }

    private async iterateOverPages<T>(fetchRewards: (page, count) => Promise<T[]>): Promise<T[]> {
        let page = 0
        const result = []
        let intermediate = []
        do {
            intermediate = await fetchRewards(page, 100)
            result.push(...intermediate)
            page++
        } while (intermediate.length > 99)
        return result
    }

    fetchAllStakingRewards(chainName: string, address: string, block_min?: number, block_max?: number): Promise<Reward[]> {
        return this.iterateOverPages<Reward>((page, count) =>
            this.fetchStakingRewards(chainName, address, count, page, true, block_min, block_max)
        )
    }

    async fetchStakingRewards(chainName: string, address: string, row: number = 100, page: number = 0, isStash: boolean, block_min?: number, block_max?: number): Promise<Reward[]> {
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
        return (responseBody.data?.list || []).map(entry => {
            return {
                event_id: entry.event_id,
                amount: BigNumber(entry.amount),
                block_timestamp: entry.block_timestamp,
                block_num: entry.block_num,
            }
        })
    }
}

