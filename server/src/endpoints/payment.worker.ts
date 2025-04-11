import * as substrateChains from "../../res/substrate-chains.json";
import {HttpError} from "../common/error/HttpError";
import {Transfer} from "../common/model/transfer";
import {FiatCurrencyService} from "../fiat-currencies/fiat-currency.service";
import {TokenPriceHistoryService} from "../crypto-currency-prices/token-price-history.service";
import {CoingeckoRestService} from "../crypto-currency-prices/coingecko-api/coingecko.rest-service";
import {CurrencyExchangeRateService} from "../fiat-currencies/currency-exchange-rate.service";
import {TokenPriceService} from "../crypto-currency-prices/token-price.service";
import {logger} from "../common/logger/logger";
import {parentPort, workerData} from 'worker_threads';
import { validateDates } from "src/common/util/validate-dates";
import { evmChainConfigs, fetchSwapsAndPayments } from "src/blockchain/evm/fetch-evm-transfers";
import { SubscanService } from "src/blockchain/substrate/api/subscan.service";
import { SubscanApi } from "src/blockchain/substrate/api/subscan.api";
import { DotTransferService } from "src/blockchain/substrate/services/dot-transfer.service";
import { BlockTimeService } from "src/blockchain/substrate/services/block-time.service";
import { coingeckoSupportsToken } from "src/common/util/coingecko-supports-token";

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
    const listOfTransfers: { [symbol: string]: { values: Transfer[], currentPrice: number } } = {}

    const currencyService = new FiatCurrencyService(new TokenPriceHistoryService(new CoingeckoRestService()), new CurrencyExchangeRateService(new ExchangeRateRestService()))

    const tokens = currencyService.getTokens(swaps)
    tokens.push(...Object.keys(payments))
    const supportedTokens = tokens.filter(symbol => coingeckoSupportsToken(symbol, chainName))
    const currentPrices = await new TokenPriceService(new CoingeckoRestService()).fetchCurrentPrices(supportedTokens, chainName, currency)

    const quoteCurrencies = ['usd', 'chf', 'eur']
    const quoteCurrency = quoteCurrencies.indexOf(currency.toLocaleLowerCase()) > -1 ? currency : 'usd'
    const quotes = await currencyService.getQuotesForTokens(supportedTokens, chainName, quoteCurrency.toLowerCase())

    for (let token of Object.keys(payments)) {
        const transfers = payments[token]
        if (!quotes[token]) {
            logger.warn(`No quotes for ${token} found.`)
            listOfTransfers[token] = {values: transfers, currentPrice: undefined}
        } else {
            listOfTransfers[token] = {
                values: await currencyService.addFiatValues(transfers, token, chainName, currency, currentPrices[token], quotes[token]),
                currentPrice: currentPrices[token]
            }
        }
    }
    const swapsExtended = await currencyService.addFiatValuesToSwaps(swaps, currency, chainName, currentPrices)
    const result = {currentPrices, swaps: swapsExtended, transfers: listOfTransfers}
    parentPort?.postMessage(result);
}
processTask(workerData);