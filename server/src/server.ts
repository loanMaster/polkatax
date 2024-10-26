import Fastify from 'fastify'
import path from "path";
import {logger} from "./logger/logger";
import dotenv from 'dotenv'
dotenv.config({ path: __dirname + '/../.env' })

import * as fs from 'fs'
import {CurrencyExchangeRateService} from "./service/currency-exchange-rate.service";
import {stakingRewardsEndpoint} from "./endpoints/staking-rewards.endoint";
import {paymentsEndpoint} from "./endpoints/payments.endpoint";
import {TokenPriceHistoryService} from "./service/token-price-history.service";
import {CryptoCompareService} from "./cryptocompare/cryptocompare.api";
import cors from '@fastify/cors';

const init = async () => {

    try {
        await new CurrencyExchangeRateService().init()
    } catch (error) {
        logger.error(error)
    }

    new TokenPriceHistoryService(new CryptoCompareService()).init()

    const fastify = Fastify({
        logger,
        https: process.env['SSL_KEY'] ? {
            key: fs.readFileSync(process.env['SSL_KEY'],'utf8'),
            cert: fs.readFileSync(process.env['SSL_CERT'],'utf8')
        } : undefined
    })
    await fastify.register(cors, {})
    await fastify.register(import('@fastify/rate-limit'), { global: false })

    fastify.addHook('onRequest', (request, reply, done) => {
        if (JSON.parse(fs.readFileSync(__dirname + '/../res/realtime-config.json', 'utf-8')).maintenanceMode && request.url.indexOf('/maintenance') == -1) {
            reply.header('Content-Type', 'text/html')
            reply.send(fs.readFileSync(__dirname + '/../public/maintenance.html', 'utf-8')).status(200)
        }
        done()
    })

    fastify.setErrorHandler( (error, request, reply) => {
        if (error.statusCode) {
            logger.info(`Error: Status ${error.statusCode}, Message: ${error.message}`, error)
            reply.status(error.statusCode).send(error.message)
        } else {
            logger.warn(`Error: ${error.message}`, error)
            if (error.stack) {
                logger.error(error.stack)
            }
            reply.status(500).send(error.message)
        }
    })

    fastify.route(stakingRewardsEndpoint)
    fastify.route(paymentsEndpoint)

    fastify.listen({ port: Number(process.env['PORT'] || 3001) , host: '0.0.0.0' }, (err) => {
        if (err) {
            fastify.log.error(err)
            process.exit(1)
        }
    })

}

init()
