import {MetaData} from "./meta-data";
import {Reward} from "./reward";
import {Block} from "./block";
import {BigNumber} from "bignumber.js";
import {Token} from "./token";
import {HttpError} from "../error/HttpError";

async function handleError(fetchRequest: Promise<Response>) {
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

    async fetchMetadata (chainName: string): Promise<MetaData> {
        const response = await handleError(fetch(`https://${chainName}.api.subscan.io/api/scan/metadata`, {
            method: `post`,
            headers: {
                'x-api-key': process.env['SUBSCAN_API_KEY']
            }
        }))
        const meta = (await response.json()).data
        return {avgBlockTime: Number(meta.avgBlockTime) || Number(meta.blockTime), blockNum: Number(meta.blockNum)}
    }

    async fetchToken (chainName: string): Promise<Token> {
        const response = await handleError(fetch(`https://${chainName}.api.subscan.io/api/scan/token`, {
            method: `post`,
            headers: {
                'x-api-key': process.env['SUBSCAN_API_KEY']
            }
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
        if (!response.ok) {
            throw new HttpError(response.status, response.statusText)
        }
        const body = await response.json();
        return body.data
    }

    async fetchAllStakingRewards(chainName: string, address: string, block_min?: number, block_max?: number): Promise<Reward[]> {
        let page = 0
        const result = []
        let intermediate = []
        for (let isStash of [true, false]) {
            do {
                // the api does not offer a method to return rewards for "stash" or "no-stash"
                intermediate = await this.fetchStakingRewards(chainName, address, 100, page, isStash, block_min, block_max)
                result.push(...intermediate)
                page++
            } while (intermediate.length > 99)
        }
        return result
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
            headers: {
                "Content-Type": "application/json",
                'x-api-key': process.env['SUBSCAN_API_KEY']
            },
            body: body
        }));
        const responseBody = await response.json()
        const result: Reward[] = (responseBody.data?.list || []).map(entry => {
            return {
                event_id: entry.event_id,
                amount: BigNumber(entry.amount),
                block_timestamp: entry.block_timestamp,
                block_num: entry.block_num,
            }
        })
        return result
    }
}

