import {FiatCurrencyService} from "./services/fiat-currency.service";
import { parentPort, workerData } from 'worker_threads';
import {CoingeckoRestService} from "../crypto-currency-prices/coingecko-api/coingecko.rest-service";
import { SubscanApi } from "../blockchain/substrate/api/subscan.api";
import { SubscanService } from "../blockchain/substrate/api/subscan.service";
import { BlockTimeService } from "../blockchain/substrate/services/block-time.service";
import { StakingRewardsService } from "../blockchain/substrate/services/staking-rewards.service";
import { CryptoCurrencyPricesFacade } from "../crypto-currency-prices/crypto-currency-prices.facade";
import { ExchangeRateRestService } from "../fiat-currencies/exchange-rate-api/exchange-rate.rest-service";
import { FiatExchangeRateService } from "../fiat-currencies/fiat-exchange-rate.service";

async function processTask(data: any) {
    let { chain, address, currency, poolId, startDay, endDay } = data
    const cryptoPriceService = new CryptoCurrencyPricesFacade(new CoingeckoRestService())
    const cryptoCurrencyPricesFacade = new CryptoCurrencyPricesFacade(new CoingeckoRestService())
    const currencyService = new FiatCurrencyService(cryptoCurrencyPricesFacade, new FiatExchangeRateService(new ExchangeRateRestService()))
    const subscanService = new SubscanService(new SubscanApi())
    const stakingRewardsService = new StakingRewardsService(new BlockTimeService(new SubscanApi()), subscanService)
    const isEvmAddress = address.length <= 42
    if (isEvmAddress) {
        address = await subscanService.mapToSubstrateAccount(chain.name, address)
    }
    const rewardsPromise = poolId > 0 ?
        stakingRewardsService.fetchNominationPoolRewards(chain.name.toLowerCase(), address, poolId, startDay.getTime(), endDay ? endDay.getTime() : undefined) :
        stakingRewardsService.fetchStakingRewards(chain.name.toLowerCase(), address, startDay.getTime(), endDay ? endDay.getTime() : undefined)
    const currentPricePromise = (cryptoPriceService.fetchCurrentPrices([chain.token], chain.name, currency))
    const [rewards, currentPrice] = await Promise.all([rewardsPromise, currentPricePromise])
    const result = {
        values: await currencyService.addFiatValues(rewards, chain.token, chain.name, currency.toLowerCase(), currentPrice[chain.token]),
        currentPrice: currentPrice[chain.token]
    }
    parentPort?.postMessage(result);
}

processTask(workerData);