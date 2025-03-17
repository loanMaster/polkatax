import {StakingRewardsService} from "../service/staking-rewards.service";
import {BlockTimeService} from "../service/block-time.service";
import {SubscanService} from "../subscan-api/subscan.service";
import {TokenPriceService} from "../service/token-price.service";
import {TokenPriceHistoryService} from "../service/token-price-history.service";
import {FiatCurrencyService} from "../service/fiat-currency.service";
import { parentPort, workerData } from 'worker_threads';
import {SubscanApi} from "../subscan-api/subscan.api";
import {CoingeckoRestService} from "../coingecko-api/coingecko.rest-service";
import {CurrencyExchangeRateService} from "../service/currency-exchange-rate.service";
import {ExchangeRateRestService} from "../exchange-rate-api/exchange-rate.rest-service";

async function processTask(data: any) {
    let { chain, address, currency, poolId, startDay, endDay } = data
    const priceService = new TokenPriceService(new CoingeckoRestService())
    const priceHistoryService = new TokenPriceHistoryService(new CoingeckoRestService())
    const currencyService = new FiatCurrencyService(priceHistoryService, new CurrencyExchangeRateService(new ExchangeRateRestService()))
    const subscanService = new SubscanService(new SubscanApi())
    const stakingRewardsService = new StakingRewardsService(new BlockTimeService(new SubscanApi()), subscanService)
    const isEvmAddress = address.length <= 42
    if (isEvmAddress) {
        address = await subscanService.mapToSubstrateAccount(chain.name, address)
    }
    const rewardsPromise = poolId > 0 ?
        stakingRewardsService.fetchNominationPoolRewards(chain.name.toLowerCase(), address, poolId, startDay.getTime(), endDay ? endDay.getTime() : undefined) :
        stakingRewardsService.fetchStakingRewards(chain.name.toLowerCase(), address, startDay.getTime(), endDay ? endDay.getTime() : undefined)
    const currentPricePromise = (priceService.fetchCurrentPrices([chain.token], chain.name, currency))
    const [rewards, currentPrice] = await Promise.all([rewardsPromise, currentPricePromise])
    const result = {
        values: await currencyService.addFiatValues(rewards, chain.token, chain.name, currency.toLowerCase(), currentPrice[chain.token]),
        currentPrice: currentPrice[chain.token]
    }
    parentPort?.postMessage(result);
}

processTask(workerData);