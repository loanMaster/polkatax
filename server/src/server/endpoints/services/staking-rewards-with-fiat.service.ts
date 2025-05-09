import { SubscanService } from "../../blockchain/substrate/api/subscan.service";
import { StakingRewardsService } from "../../blockchain/substrate/services/staking-rewards.service";
import { addFiatValuesToTransfers } from "../helper/addFiatValuesToTransfers";
import { StakingRewardsRequest } from "../model/staking-rewards.request";
import { TokenPriceConversionService } from "./token-price-conversion.service";
import { StakingRewardsResponse } from "../model/staking-rewards.response";
import { CurrencyQuotes } from "../../../model/crypto-currency-prices/crypto-currency-quotes";

export class StakingRewardsWithFiatService {
  constructor(
    private stakingRewardsService: StakingRewardsService,
    private tokenPriceConversionService: TokenPriceConversionService,
    private subscanService: SubscanService,
  ) {}

  private async fetchRawStakingRewards(
    stakingRewardsRequest: StakingRewardsRequest,
  ) {
    let { chain, address, poolId, startDay, endDay } = stakingRewardsRequest;
    const isEvmAddress = address.length <= 42;
    if (isEvmAddress) {
      address =
        (await this.subscanService.mapToSubstrateAccount(
          chain.domain,
          address,
        )) || address;
    }
    return poolId !== undefined
      ? this.stakingRewardsService.fetchNominationPoolRewards(
          chain.domain,
          address,
          poolId,
          startDay.getTime(),
          endDay ? endDay.getTime() : undefined,
        )
      : this.stakingRewardsService.fetchStakingRewards(
          chain.domain,
          address,
          startDay.getTime(),
          endDay ? endDay.getTime() : undefined,
        );
  }

  async fetchStakingRewards(
    stakingRewardsRequest: StakingRewardsRequest,
  ): Promise<StakingRewardsResponse> {
    let { chain, currency } = stakingRewardsRequest;

    const [quotes, rewards] = await Promise.all([
      this.tokenPriceConversionService.fetchQuotesForTokens(
        [chain.token],
        chain.domain,
        currency,
      ),
      this.fetchRawStakingRewards(stakingRewardsRequest),
    ]);
    return {
      values: addFiatValuesToTransfers(rewards, quotes[chain.token]),
      currentPrice: quotes[chain.token].quotes?.latest ?? 0,
      token: chain.token,
    };
  }
}
