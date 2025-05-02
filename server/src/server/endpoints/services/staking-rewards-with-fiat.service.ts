import { SubscanService } from "../../blockchain/substrate/api/subscan.service";
import { BlockTimeService } from "../../blockchain/substrate/services/block-time.service";
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
    private blockTimeService: BlockTimeService,
  ) {}

  private async fetchQuotesForToken(
    symbol: string,
    chainName: string,
    currency: string,
  ): Promise<CurrencyQuotes> {
    return (
      await this.tokenPriceConversionService.fetchQuotesForTokens(
        [symbol],
        chainName,
        currency,
      )
    )[symbol];
  }

  private async fetchRawStakingRewards(
    stakingRewardsRequest: StakingRewardsRequest,
  ) {
    let { chain, address, poolId, startDay, endDay } = stakingRewardsRequest;
    const isEvmAddress = address.length <= 42;
    if (isEvmAddress) {
      address = await this.subscanService.mapToSubstrateAccount(
        chain.domain,
        address,
      );
    }
    return poolId > 0
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
    const quotes = await this.fetchQuotesForToken(
      chain.token,
      chain.domain,
      currency,
    );
    return {
      values: addFiatValuesToTransfers(
        await this.fetchRawStakingRewards(stakingRewardsRequest),
        quotes,
      ),
      currentPrice: quotes.quotes?.latest ?? 0,
      token: chain.token,
    };
  }
}
