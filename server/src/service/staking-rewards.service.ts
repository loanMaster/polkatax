import {BlockTimeService} from "./block-time.service";
import { BigNumber } from "bignumber.js";
import {HttpError} from "../error/HttpError";
import {SubscanService} from "../subscan-api/subscan.service";
import { Transfer } from "src/model/transfer";
import {StakingReward} from "../subscan-api/staking-reward";
import {logger} from "../logger/logger";

export class StakingRewardsService {
    constructor(private blockTimeService: BlockTimeService, private subscanService: SubscanService) {
    }

    private async filterRewards(rewards: StakingReward[], chainName: string, minDate: number, maxDate: number): Promise<Transfer[]> {
        const token = await this.subscanService.fetchToken(chainName)

        return rewards.filter(r =>
            (!maxDate || r.block_timestamp < maxDate / 1000) && r.block_timestamp >= minDate / 1000
        ).map(r => {
            if (r.event_id === 'Slash') {
                throw new HttpError(500, `Program can't handle slashes, yet. The slashed amount was ${r.amount}`)
            }
            return r
        }).map(reward => ({
            ...reward,
            amount: BigNumber(reward.amount).dividedBy(Math.pow(10, token.token_decimals)).toNumber()
        })).map(reward => ({
            block: reward.block_num,
            date: reward.block_timestamp,
            amount: reward.amount,
            hash: reward.hash
        }))
    }

    async fetchStakingRewards(chainName: string, address: string, minDate: number, maxDate?: number): Promise<Transfer[]> {
        logger.info(`Exit fetchStakingRewards for address ${address} and chain ${chainName}`)
        const {blockMin, blockMax} = await this.blockTimeService.getMinMaxBlock(chainName, minDate, maxDate)
        const rewardsSlashes = await this.subscanService.fetchAllStakingRewards(chainName, address, blockMin, blockMax)
        const filtered = await this.filterRewards(rewardsSlashes, chainName, minDate, maxDate)
        logger.info(`Exit fetchStakingRewards with ${filtered.length} elements`)
        return filtered
    }

    async fetchNominationPoolRewards(chainName: string, address: string, poolId: number, minDate: number, maxDate?: number): Promise<Transfer[]> {
        const rewardsSlashes = await this.subscanService.fetchAllPoolStakingRewards(chainName, address, poolId)
        return this.filterRewards(rewardsSlashes, chainName, minDate, maxDate)
    }
}
