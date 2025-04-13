import Joi from "joi";
import {RouteOptions} from "fastify/types/route";
import {HttpError} from "../common/error/HttpError";
import * as substrateChains from "../../res/substrate/substrate-chains.json"
import { runWorker } from "./workers/run-worker";

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
        return runWorker('staking-rewards.worker.ts', {
                chain: request.params['chain'],
                address: request.params['address'],
                currency: request.query['currency'],
                poolId: request.query['poolid'],
                startDay: request.query['startdate'],
                endDay: request.query['enddate']
            }
        )
    },
    config: {
        rateLimit: {
            max: 6,
            timeWindow: '1 minute'
        }
    }
}
