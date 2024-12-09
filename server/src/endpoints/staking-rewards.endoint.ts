import {StakingRewardsService} from "../service/staking-rewards.service";
import {BlockTimeService} from "../service/block-time.service";
import Joi from "joi";
import {RouteOptions} from "fastify/types/route";
import {HttpError} from "../error/HttpError";
import {CoingeckoService} from "../coingecko-api/coingecko.service";
import {SubscanService} from "../subscan-api/subscan.service";
import * as substrateChains from "../../res/substrate-chains.json"
import {TokenPriceService} from "../service/token-price.service";
import {TokenPriceHistoryService} from "../service/token-price-history.service";
import {CurrencyExchangeRateService} from "../service/currency-exchange-rate.service";
import {FiatCurrencyService} from "../service/fiat-currency.service";
import {ChainInfo} from "../model/chain-info";

const fetchRewards = async (chain: ChainInfo, address: string, currency: string, poolId: number, startDay: Date, endDay?: Date) => {
    const priceService = new TokenPriceService(new CoingeckoService())
    const priceHistoryService = new TokenPriceHistoryService(new CoingeckoService())
    const currencyService = new FiatCurrencyService(priceHistoryService, new CurrencyExchangeRateService())
    const subscanService = new SubscanService()
    const stakingRewardsService = new StakingRewardsService(new BlockTimeService(subscanService), subscanService)
    const isEvmAddress = address.length <= 42
    if (isEvmAddress) {
        address = await subscanService.mapToSubstrateAccount(chain.name, address)
    }
    const rewardsPromise = poolId > 0 ?
        stakingRewardsService.fetchNominationPoolRewards(chain.name.toLowerCase(), address, poolId, startDay.getTime(), endDay ? endDay.getTime() : undefined) :
        stakingRewardsService.fetchStakingRewards(chain.name.toLowerCase(), address, startDay.getTime(), endDay ? endDay.getTime() : undefined)
    const currentPricePromise = (priceService.fetchCurrentPrices([chain.token], chain.name, currency))
    const [rewards, currentPrice] = await Promise.all([rewardsPromise, currentPricePromise])
    return {
        values: await currencyService.addFiatValues(rewards, chain.token, chain.name, currency.toLowerCase(), currentPrice[chain.token]),
        currentPrice: currentPrice[chain.token]
    }
}

export const stakingRewardsEndpoint: RouteOptions = {
    method: 'GET',
    url: '/api/staking-rewards/:chain/:address',
    schema: {
        params: Joi.object({
            chain: Joi.string().custom((value) => {
                const result = substrateChains.chains.find(p => p.name === value.toLowerCase())
                if (!result) {
                    throw new HttpError(400, "Chain " + value + " not found")
                }
                return result
            }),
            address: Joi.string().min(5)
        }),
        querystring: Joi.object({
            currency: Joi.string().min(1).max(5).default('usd').lowercase(),
            startdate: Joi.date(),
            enddate: Joi.date(),
            poolid: Joi.number().default(0)
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
            request.query['poolid'],
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
