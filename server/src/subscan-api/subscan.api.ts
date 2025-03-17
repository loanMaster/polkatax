import {MetaData} from "./meta-data";
import {Token} from "./token";
import {Block} from "./block";
import {StakingReward} from "./staking-reward";
import {BigNumber} from "bignumber.js";
import {Transaction} from "./transaction";
import {Transfers} from "./transfer";
import {RequestHelper} from "../util/request.helper";

export class SubscanApi {
    private requestHelper: RequestHelper

    constructor() {
        if (!process.env['SUBSCAN_API_KEY']) {
            throw Error('Subscan api key not found. It must be provided as env var SUBSCAN_API_KEY')
        }
        this.requestHelper = new RequestHelper()
        this.requestHelper.defaultHeader = {
            "Content-Type": "application/json",
            'x-api-key': process.env['SUBSCAN_API_KEY']
        }
    }

    async mapToSubstrateAccount(chainName: string, account: string): Promise<string> {
        const response = await this.requestHelper.req(`https://${chainName}.api.subscan.io/api/v2/scan/search`, 'post', {key: account})
        const info = response.data
        return info?.account?.substrate_account?.address
    }

    async fetchMetadata(chainName: string): Promise<MetaData> {
        const response = await this.requestHelper.req(`https://${chainName}.api.subscan.io/api/scan/metadata`, `post`, {})
        const meta = response.data
        return {avgBlockTime: Number(meta.avgBlockTime) || Number(meta.blockTime), blockNum: Number(meta.blockNum)}
    }

    async fetchNativeToken(chainName: string): Promise<Token> {
        const response = await this.requestHelper.req(`https://${chainName}.api.subscan.io/api/scan/token`, `post`, {})
        const data = response.data
        const nativeTokenSymbol = Object.keys(data.detail).find(symbol =>
            data.detail[symbol].asset_type === `native`
        )
        return data.detail[nativeTokenSymbol]
    }

    async fetchBlock(chainName: string, blockNum: number): Promise<Block> {
        const response = await this.requestHelper.req(`https://${chainName}.api.subscan.io/api/scan/block`, `post`, {
            block_num: blockNum,
            only_head: true
        })
        return response.data
    }

    async fetchBlockList(chainName: string, page = 0, row = 1): Promise<Block[]> {
        const response = await this.requestHelper.req(`https://${chainName}.api.subscan.io/api/v2/scan/blocks`, `post`, {
            page,
            row
        })
        return response.data.blocks
    }

    private mapStakingRewards(rawResponseList: any[] | undefined) {
        return (rawResponseList || []).map(entry => {
            return {
                event_id: entry.event_id,
                amount: BigNumber(entry.amount),
                block_timestamp: entry.block_timestamp,
                block_num: entry.extrinsic_index.split('-')[0],
                hash: entry.extrinsic_hash
            }
        })
    }

    public async fetchPoolStakingRewards(chainName: string, address: string, pool_id: number, row: number = 100, page: number = 0): Promise<{ list: StakingReward[], hasNext: boolean }> {
        const responseBody = await this.requestHelper.req(`https://${chainName}.api.subscan.io/api/scan/nomination_pool/rewards`, `post`,
            {
                row,
                page,
                address,
                pool_id
            }
        );
        return {
            list: this.mapStakingRewards(responseBody.data?.list),
            hasNext: (responseBody.data?.list || []).length >= row
        }
    }

    async fetchStakingRewards(chainName: string, address: string, row: number = 100, page: number = 0, isStash: boolean, block_min?: number, block_max?: number): Promise<{ list: StakingReward[], hasNext: boolean }> {
        const responseBody = await this.requestHelper.req(`https://${chainName}.api.subscan.io/api/scan/account/reward_slash`, `post`, {
            row,
            page,
            address,
            'is_stash': isStash,
            block_range: block_min !== undefined && block_max !== undefined ? `${block_min}-${block_max}` : undefined
        });
        return {
            list: this.mapStakingRewards(responseBody.data?.list),
            hasNext: (responseBody.data?.list || []).length >= row
        }
    }

    async fetchAccounts(address: string, chainName: string): Promise<string[]> {
        const json = await this.requestHelper.req(`https://${chainName}.api.subscan.io/api/v2/scan/accounts`, `post`, {
            address: [address],
            row: 100
        });
        return (json?.data?.list && json?.data?.list.length > 0 ?
            json.data.list.map(entry => ({address: entry.address.toLowerCase()})) :
            [{address}]).map(entry => entry.address.toLowerCase())
    }

    async fetchExtrinsics(chainName: string, address: string, row: number = 100, page: number = 0, block_min?: number, block_max?: number, evm = false): Promise<{ list: Transaction[], hasNext: boolean }> {
        const endpoint = evm ? 'api/scan/evm/v2/transactions' : 'api/v2/scan/extrinsics'
        const responseBody = await this.requestHelper.req(`https://${chainName}.api.subscan.io/${endpoint}`, `post`, {
            row,
            page,
            address,
            success: true,
            block_range: block_min !== undefined && block_max !== undefined ? `${block_min}-${block_max}` : undefined
        });
        return {
            list: (responseBody.data?.extrinsics || responseBody.data?.list || []).map(entry => {
                if (evm) {
                    entry = {
                        ...entry,
                        account_display: {
                            address: entry.from
                        },
                        functionName: entry.method,
                        callModule: entry.contract_name,
                        extrinsic_hash: entry.hash
                    }
                }
                return {
                    hash: entry.extrinsic_hash,
                    account: entry.account_display.address,
                    block_timestamp: entry.block_timestamp,
                    block_num: entry.block_num,
                    functionName: entry.call_module_function,
                    callModule: entry.call_module
                }
            }), hasNext: (responseBody.data?.extrinsics || responseBody.data?.list || []).length >= row
        }
    }

    async fetchTransfers(chainName: string, account: string, isMyAccount: (string) => boolean, row: number = 100, page: number = 0, block_min?: number, block_max?: number, evm = false): Promise<{ list: Transfers[], hasNext: boolean }> {
        const endpoint = evm ? 'api/scan/evm/token/transfer' : 'api/v2/scan/transfers'
        const responseBody = await this.requestHelper.req(`https://${chainName}.api.subscan.io/${endpoint}`, `post`, {
            row,
            page,
            address: account,
            success: true,
            block_range: block_min !== undefined && block_max !== undefined ? `${block_min}-${block_max}` : undefined
        });
        const transfers: any = {};
        (responseBody.data?.transfers || responseBody.data?.list || []).forEach(entry => {
            if (evm) {
                entry = {
                    ...entry,
                    asset_symbol: entry.symbol,
                    module: entry.to_display?.evm_contract?.contract_name,
                    amount: BigNumber(entry.value).dividedBy(BigNumber(10).pow(entry.decimals)).toNumber(),
                    block_timestamp: entry.create_at
                }
            }
            const otherAddress = isMyAccount(entry.from) ? entry.to : entry.from
            if (!transfers[entry.hash]) {
                transfers[entry.hash] = {}
            }
            if (!transfers[entry.hash][entry.asset_symbol]) {
                transfers[entry.hash][entry.asset_symbol] = {amount: 0}
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
        return {
            list: [transfers],
            hasNext: (responseBody.data?.transfers || responseBody.data?.list || []).length >= row
        }
    }
}