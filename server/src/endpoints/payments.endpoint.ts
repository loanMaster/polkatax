import Joi from "joi";
import {RouteOptions} from "fastify/types/route";
import {HttpError} from "../error/HttpError";
import {CoingeckoService} from "../coingecko-api/coingecko.service";
import * as substrateChains from "../../res/substrate-chains.json"
import {TokenPriceService} from "../service/token-price.service";
import {TokenPriceHistoryService} from "../service/token-price-history.service";
import {CurrencyExchangeRateService} from "../service/currency-exchange-rate.service";
import {logger} from "../logger/logger";
import {BlockTimeService} from "../service/block-time.service";
import {SubscanService} from "../subscan-api/subscan.service";
import {Transfer} from "../model/transfer";
import {FiatCurrencyService} from "../service/fiat-currency.service";
import {DotTransferService} from "../service/dot-transfer.service";
import {coingeckoSupportsToken} from "../util/coingecko-supports-token";
import {validateDates} from "../util/validate-dates";
import {
    evmChainConfigs,
    fetchSwapsAndPayments
} from "../service/etherscan/fetch-evm-transfers";


const fetchRewards = async (chainName: string, address: string, currency: string, startDay: Date, endDay: Date) => {
    validateDates(startDay, endDay)
    endDay = endDay && endDay < new Date() ? endDay : new Date()
    if (!evmChainConfigs[chainName.toLocaleLowerCase()] && !substrateChains.chains.find(p => p.name === chainName.toLowerCase())) {
        throw new HttpError(400, "Chain " + chainName + " not found")
    }

    const evmChainConfig = evmChainConfigs[chainName.toLocaleLowerCase()]
    const tokenRewardsService = new DotTransferService(new BlockTimeService(new SubscanService()), new SubscanService())
    const { swaps, payments } = evmChainConfig ? await fetchSwapsAndPayments(chainName, address, startDay, endDay) :
        await tokenRewardsService.fetchSwapsAndTransfers(chainName, address, startDay, endDay)
    const listOfTransfers: { [symbol: string]: { values: Transfer[], currentPrice: number } } = {}

    const currencyService = new FiatCurrencyService(new TokenPriceHistoryService(new CoingeckoService()), new CurrencyExchangeRateService())

    const tokens = currencyService.getTokens(swaps)
    tokens.push(...Object.keys(payments))
    const supportedTokens = tokens.filter(symbol => coingeckoSupportsToken(symbol, chainName))
    const currentPrices = await new TokenPriceService(new CoingeckoService()).fetchCurrentPrices(supportedTokens, chainName, currency)

    const quotes = await currencyService.getQuotesForTokens(supportedTokens, chainName)

    for (let token of Object.keys(payments)) {
        const transfers = payments[token]
        if (!quotes[token]) {
            logger.warn(`No quotes for ${token} found.`)
            listOfTransfers[token] = { values: transfers, currentPrice: undefined }
        } else {
            listOfTransfers[token] = { values: await currencyService.addFiatValues(transfers, token, chainName, currency, currentPrices[token], quotes[token]), currentPrice: currentPrices[token] }
        }
    }
    const swapsExtended = await currencyService.addFiatValuesToSwaps(swaps, 'CHF', chainName, currentPrices)
    return { currentPrices, swaps: swapsExtended, transfers: listOfTransfers }
}

export const paymentsEndpoint: RouteOptions = {
    method: 'GET',
    url: '/api/payments/:chain/:address',
    schema: {
        params: Joi.object({
            chain: Joi.string(),
            address: Joi.string().min(5)
        }),
        querystring: Joi.object({
            currency: Joi.string().min(1).max(5).default('usd').lowercase(),
            startdate: Joi.date(),
            enddate: Joi.date()
        })
    },
    validatorCompiler: ({schema, method, url, httpPart}) => {
        return data => (schema as any).validate(data)
    },
    handler: async (request, reply) => {
        return fetchRewards(
            request.params['chain'],
            request.params['address'],
            request.query['currency'],
            request.query['startdate'],
            request.query['enddate']
        )
    },
    config: {
        rateLimit: {
            max: 6,
            timeWindow: '1 minute'
        }
    }
}
