import {validateDates} from "../util/validate-dates";
import {evmChainConfigs, fetchSwapsAndPayments} from "../service/etherscan/fetch-evm-transfers";
import * as substrateChains from "../../res/substrate-chains.json";
import {HttpError} from "../error/HttpError";
import {DotTransferService} from "../service/dot-transfer.service";
import {BlockTimeService} from "../service/block-time.service";
import {SubscanService} from "../subscan-api/subscan.service";
import {Transfer} from "../model/transfer";
import {FiatCurrencyService} from "../service/fiat-currency.service";
import {TokenPriceHistoryService} from "../service/token-price-history.service";
import {CoingeckoService} from "../coingecko-api/coingecko.service";
import {CurrencyExchangeRateService} from "../service/currency-exchange-rate.service";
import {coingeckoSupportsToken} from "../util/coingecko-supports-token";
import {TokenPriceService} from "../service/token-price.service";
import {logger} from "../logger/logger";
import {parentPort, workerData} from 'worker_threads';

async function processTask(data: any) {
    let { startDay, endDay, chainName, address, currency } = data

    validateDates(startDay, endDay)
    endDay = endDay && endDay < new Date() ? endDay : new Date()
    if (!evmChainConfigs[chainName.toLocaleLowerCase()] && !substrateChains.chains.find(p => p.name === chainName.toLowerCase())) {
        throw new HttpError(400, "Chain " + chainName + " not found")
    }

    const evmChainConfig = evmChainConfigs[chainName.toLocaleLowerCase()]
    const tokenRewardsService = new DotTransferService(new BlockTimeService(new SubscanService()), new SubscanService())
    const {swaps, payments} = evmChainConfig ? await fetchSwapsAndPayments(chainName, address, startDay, endDay) :
        await tokenRewardsService.fetchSwapsAndTransfers(chainName, address, startDay, endDay)
    const listOfTransfers: { [symbol: string]: { values: Transfer[], currentPrice: number } } = {}

    const currencyService = new FiatCurrencyService(new TokenPriceHistoryService(new CoingeckoService()), new CurrencyExchangeRateService())

    const tokens = currencyService.getTokens(swaps)
    tokens.push(...Object.keys(payments))
    const supportedTokens = tokens.filter(symbol => coingeckoSupportsToken(symbol, chainName))
    const currentPrices = await new TokenPriceService(new CoingeckoService()).fetchCurrentPrices(supportedTokens, chainName, currency)

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