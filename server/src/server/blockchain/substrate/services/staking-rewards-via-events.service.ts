import BigNumber from "bignumber.js";
import { SubscanService } from "../api/subscan.service";
import { RawStakingReward } from "../model/staking-reward";

export class StakingRewardsViaEventsService {
  constructor(private subscanService: SubscanService) {}

  async fetchStakingRewards(
    chain,
    address,
    module,
    eventId,
    blockMin,
    blockMax,
  ): Promise<RawStakingReward[]> {
    const events = await this.subscanService.searchAllEvents(
      chain,
      address,
      module,
      eventId,
      blockMin,
      blockMax,
    );
    const transfers = await this.subscanService.fetchAllTransfers(
      chain,
      address,
      blockMin,
      blockMax,
    );
    const eventHashes = events.map((e) => e.extrinsic_hash);
    return transfers
      .filter((transfer) => eventHashes.indexOf(transfer.hash) > -1)
      .map((transfer) => {
        return {
          event_id: BigNumber(transfer.amount_v2).lt(0) ? "Slash" : "Reward",
          amount: BigNumber(transfer.amount_v2),
          block_timestamp: transfer.block_timestamp,
          block_num: Number(transfer.extrinsic_index.split("-")[0]),
          hash: transfer.hash,
        };
      });
  }
}
