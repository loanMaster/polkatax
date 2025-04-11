import {Token} from "../model/token";
import {Transfers} from "../model/transfer";
import {Transaction} from "../model/transaction";
import {StakingReward} from "../model/staking-reward";
import {SubscanApi} from "./subscan.api";
import { logger } from "src/common/logger/logger";
import { mergeListElements } from "src/common/util/merge-list";

export class SubscanService {

    constructor(private subscanApi: SubscanApi) {
    }

    async mapToSubstrateAccount(chainName: string, account: string): Promise<string> {
        logger.info(`Enter mapToSubstrateAccount for chain ${chainName} and account ${account}`)
        const address = await this.subscanApi.mapToSubstrateAccount(chainName, account)
        logger.info(`Exit mapToSubstrateAccount with address ${address}`)
        return address
    }

    async fetchNativeToken(chainName: string): Promise<Token> {
        return this.subscanApi.fetchNativeToken(chainName)
    }

    async fetchAllPoolStakingRewards(chainName: string, address: string, poolId: number): Promise<StakingReward[]> {
        return this.iterateOverPages<StakingReward>((page, count) =>
            this.subscanApi.fetchPoolStakingRewards(chainName, address, poolId, count, page)
        )
    }

    private async retry<T>(query: () => Promise<T>, retries = 2, backOff = [5000, 30000]): Promise<T> {
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
            this.subscanApi.fetchStakingRewards(chainName, address, count, page, true, block_min, block_max)
        )
    }

    fetchAllTx(chainName: string, address: string, block_min?: number, block_max?: number, evm = false): Promise<Transaction[]> {
        logger.info(`fetchAllExtrinsics for ${chainName} and address ${address}. Evm ${evm}`)
        const result = this.iterateOverPages<Transaction>((page, count) =>
            this.subscanApi.fetchExtrinsics(chainName, address, count, page, block_min, block_max, evm))
        logger.info(`Exit fetchAllExtrinsics for ${chainName} and address ${address}`)
        return result
    }

    async fetchAllTransfers(chainName: string, account: string, block_min?: number, block_max?: number, evm = false): Promise<Transfers> {
        logger.info(`fetchAllTransfers for ${chainName} and account ${account}. Evm: ${evm}`)
        const addresses = await this.subscanApi.fetchAccounts(account, chainName)
        const isMyAccount = (address: string) => address.toLowerCase() === account.toLowerCase() || addresses.indexOf(address.toLowerCase()) > -1
        const result = mergeListElements(await this.iterateOverPages<any>((page, count) =>
            this.subscanApi.fetchTransfers(chainName, account, isMyAccount, count, page, block_min, block_max, evm)))
        logger.info(`Exit fetchAllTransfers for ${chainName} and account ${account}`)
        return result
    }
}

