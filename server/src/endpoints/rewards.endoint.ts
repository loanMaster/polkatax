import {StakingRewardsService} from "../service/staking-rewards.service";
import {BlockTimeService} from "../service/block-time.service";
import {CurrencyService} from "../service/currency.service";
import Joi from "joi";
import {RouteOptions} from "fastify/types/route";
import {HttpError} from "../error/HttpError";
import {PriceService} from "../service/price.service";
import {CoingeckoService} from "../coingecko-api/coingecko.service";
import {SubscanService} from "../subscan-api/subscan.service";
import {PriceHistoryService} from "../service/price-history.service";
import {SubstrateChain} from "../model/substrate-chain";
import * as substrateChains from "../../res/substrate-chains.json"

const fetchRewards = async (chain: SubstrateChain, address: string, currency: string, poolId: number, startDay: Date, endDay?: Date) => {
    const priceService = new PriceService(new CoingeckoService())
    const priceHistoryService = new PriceHistoryService(new CoingeckoService())
    const currencyService = new CurrencyService(priceHistoryService)
    const subscanService = new SubscanService()
    const stakingRewardsService = await new StakingRewardsService(new BlockTimeService(subscanService), subscanService)
    const rewards = poolId > 0 ?
        await stakingRewardsService.fetchNominationPoolRewards(chain.name.toLowerCase(), address, poolId, startDay.getTime(), endDay ? endDay.getTime() : undefined) :
        await stakingRewardsService.fetchStakingRewards(chain.name.toLowerCase(), address, startDay.getTime(), endDay ? endDay.getTime() : undefined)
    const currentPrice = await priceService.fetchCurrentPrice(chain.coingeckoId, currency)
    return {
        values: await currencyService.addFiatValues(rewards, chain.token, currency.toLowerCase(), currentPrice),
        currentPrice
    }
}

export const rewardsEndpoint: RouteOptions = {
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
            currency: Joi.string().min(1).max(5).default('usd'),
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
