import * as substrateChains from "../../res/substrate/substrate-chains.json";
import {HttpError} from "../common/error/HttpError";
import {Transfer} from "../common/model/transfer";
import {CoingeckoRestService} from "../crypto-currency-prices/coingecko-api/coingecko.rest-service";
import {parentPort, workerData} from 'worker_threads';
import { evmChainConfigs, fetchSwapsAndPayments } from "../blockchain/evm/fetch-evm-transfers";
import { SubscanApi } from "../blockchain/substrate/api/subscan.api";
import { SubscanService } from "../blockchain/substrate/api/subscan.service";
import { BlockTimeService } from "../blockchain/substrate/services/block-time.service";
import { DotTransferService } from "../blockchain/substrate/services/dot-transfer.service";
import { coingeckoSupportsToken } from "../common/util/coingecko-supports-token";
import { validateDates } from "../common/util/validate-dates";
import { CryptoCurrencyPricesFacade } from "../crypto-currency-prices/crypto-currency-prices.facade";
import { ExchangeRateRestService } from "../fiat-currencies/exchange-rate-api/exchange-rate.rest-service";
import { FiatExchangeRateService } from "../fiat-currencies/fiat-exchange-rate.service";
import { Swap } from "../common/model/swap";
import { addFiatValuesToNestedTransfers } from "./helper/addFiatValuesToNestedTransfers";
import { addFiatValuesToSwaps } from "./helper/addFiatValuesToSwaps";
import { CombineTokenAndFiatPriceService } from "./services/combine-token-and-fiat-price.service";

function getTokens(swaps: Swap[]): string[] {
    const tokens = []
    swaps.forEach(s => {
        Object.keys(s.tokens).forEach(t => {
            if (tokens.indexOf(t) === -1) {
                tokens.push(t)
            }
        })
    })
    return tokens
}

async function processTask(data: any) {
    let { startDay, endDay, chainName, address, currency } = data

    validateDates(startDay, endDay)
    endDay = endDay && endDay < new Date() ? endDay : new Date()
    if (!evmChainConfigs[chainName.toLocaleLowerCase()] && !substrateChains.chains.find(p => p.name === chainName.toLowerCase())) {
        throw new HttpError(400, "Chain " + chainName + " not found")
    }

    const evmChainConfig = evmChainConfigs[chainName.toLocaleLowerCase()]
    const subscanService = new SubscanService(new SubscanApi())
    const tokenRewardsService = new DotTransferService(new BlockTimeService(new SubscanApi()), subscanService)
    const {swaps, payments} = evmChainConfig ? await fetchSwapsAndPayments(chainName, address, startDay, endDay) :
        await tokenRewardsService.fetchSwapsAndTransfers(chainName, address, startDay, endDay)
    
    const cryptoCurrencyPricesFacade = new CryptoCurrencyPricesFacade(new CoingeckoRestService())
    const fiatExchangeRateService = new FiatExchangeRateService(new ExchangeRateRestService())

    const priceService = new CombineTokenAndFiatPriceService(cryptoCurrencyPricesFacade, fiatExchangeRateService)

    const tokens = getTokens(swaps)
    tokens.push(...Object.keys(payments))
    const supportedTokens = Array.from(new Set(tokens.filter(symbol => coingeckoSupportsToken(symbol, chainName))))

    const quotes = await priceService.fetchQuotesForTokens(supportedTokens, chainName, currency)

    const listOfTransfers: { [symbol: string]: { values: Transfer[], currentPrice: number } } = addFiatValuesToNestedTransfers(payments, quotes);

    const currentPrices = {};
    Object.keys(quotes).forEach(token => (currentPrices[token] = quotes[token].quotes.latest))
    const swapsExtended = addFiatValuesToSwaps(swaps, quotes)
    const result = {currentPrices, swaps: swapsExtended, transfers: listOfTransfers}
    parentPort?.postMessage(result);
}

processTask(workerData);