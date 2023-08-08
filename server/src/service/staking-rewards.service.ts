import {BlockTimeService} from "./block-time.service";
import { BigNumber } from "bignumber.js";
import {Reward} from "../subscan-api/reward";
import {HttpError} from "../error/HttpError";
import {SubscanService} from "../subscan-api/subscan.service";

export class StakingRewardsService {
    constructor(private blockTimeService: BlockTimeService, private subscanService: SubscanService) {
    }

    private async filterRewards(rewards: Reward[], chainName: string, minDate: number, maxDate: number): Promise<Reward[]> {
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
        }))
    }

    async fetchStakingRewards(chainName: string, address: string, minDate: number, maxDate?: number): Promise<Reward[]> {
        const {blockMin} = await this.blockTimeService.estimateBlockNo(chainName, minDate)
        const {blockMax} = await this.blockTimeService.estimateBlockNo(chainName, maxDate)
        const rewardsSlashes = await this.subscanService.fetchAllStakingRewards(chainName, address, blockMin, blockMax)
        return this.filterRewards(rewardsSlashes, chainName, minDate, maxDate)
    }

    async fetchNominationPoolRewards(chainName: string, address: string, poolId: number, minDate: number, maxDate?: number): Promise<Reward[]> {
        const rewardsSlashes = await this.subscanService.fetchAllPoolStakingRewards(chainName, address, poolId)
        return this.filterRewards(rewardsSlashes, chainName, minDate, maxDate)
    }
}
