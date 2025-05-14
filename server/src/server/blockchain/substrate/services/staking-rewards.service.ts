import { BlockTimeService } from "./block-time.service";
import { BigNumber } from "bignumber.js";
import { SubscanService } from "../api/subscan.service";
import { StakingReward } from "../model/staking-reward";
import { Transfer } from "../../../../model/transfer";
import { logger } from "../../../logger/logger";
import { StakingRewardsViaEventsService } from "./staking-rewards-via-events.service";

export class StakingRewardsService {
  constructor(
    private blockTimeService: BlockTimeService,
    private subscanService: SubscanService,
    private stakingRewardsViaEventsService: StakingRewardsViaEventsService,
  ) {}

  private async filterRewards(
    rewards: StakingReward[],
    chainName: string,
    minDate: number,
    maxDate: number,
  ): Promise<Transfer[]> {
    const token = await this.subscanService.fetchNativeToken(chainName);

    return rewards
      .filter(
        (r) =>
          (!maxDate || r.block_timestamp < maxDate / 1000) &&
          r.block_timestamp >= minDate / 1000,
      )
      .map((reward) => ({
        ...reward,
        amount:
          BigNumber(reward.amount)
            .dividedBy(Math.pow(10, token.token_decimals))
            .toNumber() * (reward.event_id === "Slash" ? -1 : 1),
      }))
      .map((reward) => ({
        block: reward.block_num,
        timestamp: reward.block_timestamp,
        amount: reward.amount,
        hash: reward.hash,
      }));
  }

  async fetchStakingRewards(
    chainName: string,
    address: string,
    minDate: number,
    maxDate?: number,
  ): Promise<Transfer[]> {
    logger.info(
      `Entry fetchStakingRewards for address ${address} and chain ${chainName}`,
    );
    const { blockMin, blockMax } = await this.blockTimeService.getMinMaxBlock(
      chainName,
      minDate,
      maxDate,
    );
    const rewardsSlashes = await (() => {
      switch (chainName) {
        case "mythos":
          return this.stakingRewardsViaEventsService.fetchStakingRewards(
            chainName,
            address,
            "collatorstaking",
            "StakingRewardReceived",
            blockMin,
            blockMax,
          );
        case "energywebx":
          return this.stakingRewardsViaEventsService.fetchStakingRewards(
            chainName,
            address,
            "parachainstaking",
            "Rewarded",
            blockMin,
            blockMax,
          );
        case "darwinia":
          return this.stakingRewardsViaEventsService.fetchStakingRewards(
            chainName,
            address,
            "darwiniastaking",
            "RewardAllocated",
            blockMin,
            blockMax,
          );
        case "robonomics-freemium":
          return this.stakingRewardsViaEventsService.fetchStakingRewards(
            chainName,
            address,
            "staking",
            "reward",
            blockMin,
            blockMax,
          );
        default:
          return this.subscanService.fetchAllStakingRewards(
            chainName,
            address,
            blockMin,
            blockMax,
          );
      }
    })();
    const filtered = await this.filterRewards(
      rewardsSlashes,
      chainName,
      minDate,
      maxDate,
    );
    logger.info(`Exit fetchStakingRewards with ${filtered.length} elements`);
    return filtered;
  }

  async fetchNominationPoolRewards(
    chainName: string,
    address: string,
    poolId: number,
    minDate: number,
    maxDate?: number,
  ): Promise<Transfer[]> {
    const rewardsSlashes = await this.subscanService.fetchAllPoolStakingRewards(
      chainName,
      address,
      poolId,
    );
    return this.filterRewards(rewardsSlashes, chainName, minDate, maxDate);
  }
}
