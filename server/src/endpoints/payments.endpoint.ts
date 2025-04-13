import Joi from "joi";
import {RouteOptions} from "fastify/types/route";
import { runWorker } from "./workers/run-worker";

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
        return runWorker('payment.worker.ts', {
            chainName: request.params['chain'],
            address: request.params['address'],
            currency: request.query['currency'],
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
