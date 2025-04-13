import { parentPort, workerData } from 'worker_threads';
import { CoingeckoRestService} from "../crypto-currency-prices/coingecko-api/coingecko.rest-service";
import { SubscanApi } from "../blockchain/substrate/api/subscan.api";
import { SubscanService } from "../blockchain/substrate/api/subscan.service";
import { BlockTimeService } from "../blockchain/substrate/services/block-time.service";
import { StakingRewardsService } from "../blockchain/substrate/services/staking-rewards.service";
import { CryptoCurrencyPricesFacade } from "../crypto-currency-prices/crypto-currency-prices.facade";
import { ExchangeRateRestService } from "../fiat-currencies/exchange-rate-api/exchange-rate.rest-service";
import { FiatExchangeRateService } from "../fiat-currencies/fiat-exchange-rate.service";
import { CurrencyQuotes } from "../crypto-currency-prices/model/crypto-currency-quotes";
import { addFiatValuesToTransfers } from './helper/addFiatValuesToTransfers';
import { CombineTokenAndFiatPriceService } from './services/combine-token-and-fiat-price.service';

async function fetchQuotesForToken(symbol: string, chainName: string, currency: string): Promise<CurrencyQuotes> {
    const priceService = new CombineTokenAndFiatPriceService(new CryptoCurrencyPricesFacade(new CoingeckoRestService()), new FiatExchangeRateService(new ExchangeRateRestService))
    return (await priceService.fetchQuotesForTokens([symbol], chainName, currency))[symbol]
}

async function fetchStakingRewards(data: any) {
    let { chain, address, poolId, startDay, endDay } = data
    const subscanService = new SubscanService(new SubscanApi())
    const stakingRewardsService = new StakingRewardsService(new BlockTimeService(new SubscanApi()), subscanService)
    const isEvmAddress = address.length <= 42
    if (isEvmAddress) {
        address = await subscanService.mapToSubstrateAccount(chain.name, address)
    }
    return poolId > 0 ?
        stakingRewardsService.fetchNominationPoolRewards(chain.name.toLowerCase(), address, poolId, startDay.getTime(), endDay ? endDay.getTime() : undefined) :
        stakingRewardsService.fetchStakingRewards(chain.name.toLowerCase(), address, startDay.getTime(), endDay ? endDay.getTime() : undefined)
}

async function processTask(data: any) {
    let { chain, currency } = data
    parentPort?.postMessage(await addFiatValuesToTransfers(await fetchStakingRewards(data), await fetchQuotesForToken(chain.symbol, chain.name, currency)));
}

processTask(workerData);