import * as substrateChains from "../../res/substrate/substrate-chains.json";
import {HttpError} from "../common/error/HttpError";
import {Transfer} from "../common/model/transfer";
import {FiatCurrencyService} from "./services/fiat-currency.service";
import {CoingeckoRestService} from "../crypto-currency-prices/coingecko-api/coingecko.rest-service";
import {logger} from "../common/logger/logger";
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
    const cryptoCurrencyPricesFacade = new CryptoCurrencyPricesFacade(new CoingeckoRestService())
    const fiatExchangeRateService = new FiatExchangeRateService(new ExchangeRateRestService())

    const currencyService = new FiatCurrencyService(cryptoCurrencyPricesFacade, fiatExchangeRateService)

    const tokens = currencyService.getTokens(swaps)
    tokens.push(...Object.keys(payments))
    const supportedTokens = tokens.filter(symbol => coingeckoSupportsToken(symbol, chainName))
    const currentPrices = await cryptoCurrencyPricesFacade.fetchCurrentPrices(supportedTokens, chainName, currency)

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