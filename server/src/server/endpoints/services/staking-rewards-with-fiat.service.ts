import { SubscanService } from "../../blockchain/substrate/api/subscan.service";
import { StakingRewardsService } from "../../blockchain/substrate/services/staking-rewards.service";
import { StakingRewardsRequest } from "../model/staking-rewards.request";
import { TokenPriceConversionService } from "./token-price-conversion.service";
import { StakingRewardsResponse } from "../model/staking-rewards.response";
import { formatDate } from "../../../common/util/date-utils";
import { addFiatValuesToStakingRewards } from "../helper/add-fiat-values-to-staking-rewards";
import { StakingReward } from "../../blockchain/substrate/model/staking-reward";
import { findCoingeckoIdForNativeToken } from "../helper/find-coingecko-id-for-native-token";

export class StakingRewardsWithFiatService {
  constructor(
    private stakingRewardsService: StakingRewardsService,
    private tokenPriceConversionService: TokenPriceConversionService,
    private subscanService: SubscanService,
  ) {}

  private async fetchRawStakingRewards(
    stakingRewardsRequest: StakingRewardsRequest,
  ): Promise<StakingReward[]> {
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
    let { chain, currency, endDay } = stakingRewardsRequest;

    const coingeckoId = findCoingeckoIdForNativeToken(chain.domain);

    const [quotes, rewards] = await Promise.all([
      this.tokenPriceConversionService.fetchQuotesForTokens(
        [coingeckoId],
        currency,
      ),
      this.fetchRawStakingRewards(stakingRewardsRequest),
    ]);
    let priceEndDay =
      endDay &&
      quotes[coingeckoId].quotes &&
      quotes[coingeckoId].quotes.hasOwnProperty(formatDate(endDay))
        ? quotes[coingeckoId].quotes[formatDate(endDay)]
        : quotes[coingeckoId].quotes?.latest;

    return {
      values: addFiatValuesToStakingRewards(rewards, quotes[coingeckoId]),
      currentPrice: quotes[coingeckoId].quotes?.latest,
      priceEndDay,
      token: chain.token,
    };
  }
}
