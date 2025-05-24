import { BlockTimeService } from "./block-time.service";
import { BigNumber } from "bignumber.js";
import { SubscanService } from "../api/subscan.service";
import { StakingReward } from "../model/staking-reward";
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
    minDate: number,
    maxDate: number,
  ): Promise<StakingReward[]> {
    return rewards
      .filter(
        (r) =>
          (!maxDate || r.timestamp <= maxDate / 1000) &&
          r.timestamp >= minDate / 1000,
      )
      .map((reward) => ({
        block: reward.block,
        timestamp: reward.timestamp,
        amount: reward.amount,
        hash: reward.hash,
      }));
  }

  async fetchStakingRewards(
    chainName: string,
    address: string,
    minDate: number,
    maxDate?: number,
  ): Promise<StakingReward[]> {
    logger.info(
      `Entry fetchStakingRewards for address ${address} and chain ${chainName}`,
    );
    const { blockMin, blockMax } = await this.blockTimeService.getMinMaxBlock(
      chainName,
      minDate,
      maxDate,
    );
    const rewardsSlashes = await (async () => {
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
          const token = await this.subscanService.fetchNativeToken(chainName);
          const rawRewards = await this.subscanService.fetchAllStakingRewards(
            chainName,
            address,
            blockMin,
            blockMax,
          );
          return rawRewards.map((reward) => ({
            ...reward,
            amount:
              BigNumber(reward.amount)
                .dividedBy(Math.pow(10, token.token_decimals))
                .toNumber() * (reward.event_id === "Slash" ? -1 : 1),
          }));
      }
    })();
    const filtered = await this.filterRewards(rewardsSlashes, minDate, maxDate);
    logger.info(`Exit fetchStakingRewards with ${filtered.length} elements`);
    return filtered;
  }

  async fetchNominationPoolRewards(
    chainName: string,
    address: string,
    poolId: number,
    minDate: number,
    maxDate?: number,
  ): Promise<StakingReward[]> {
    const token = await this.subscanService.fetchNativeToken(chainName);
    const rawRewardsSlashes =
      await this.subscanService.fetchAllPoolStakingRewards(
        chainName,
        address,
        poolId,
      );
    const rewardsSlashes = rawRewardsSlashes.map((reward) => ({
      ...reward,
      amount:
        BigNumber(reward.amount)
          .dividedBy(Math.pow(10, token.token_decimals))
          .toNumber() * (reward.event_id === "Slash" ? -1 : 1),
    }));
    return this.filterRewards(rewardsSlashes, minDate, maxDate);
  }
}
