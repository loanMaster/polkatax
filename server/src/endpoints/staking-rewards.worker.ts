import {StakingRewardsService} from "../service/staking-rewards.service";
import {BlockTimeService} from "../service/block-time.service";
import {SubscanService} from "../substrate-blockchain/api/subscan.service";
import {TokenPriceService} from "../crypto-currency-prices/token-price.service";
import {TokenPriceHistoryService} from "../crypto-currency-prices/token-price-history.service";
import {FiatCurrencyService} from "../fiat-currencies/fiat-currency.service";
import { parentPort, workerData } from 'worker_threads';
import {SubscanApi} from "../substrate-blockchain/api/subscan.api";
import {CoingeckoRestService} from "../crypto-currency-prices/coingecko-api/coingecko.rest-service";
import {CurrencyExchangeRateService} from "../fiat-currencies/currency-exchange-rate.service";
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