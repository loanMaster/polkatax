import Fastify from 'fastify'
import {rewardsEndpoint} from "./endpoints/rewards.endoint";
import path from "path";
import {logger} from "./logger/logger";
import dotenv from 'dotenv'
import * as fs from 'fs'

dotenv.config({ path: __dirname + '/../.env' })

const init = async () => {
    const fastify = Fastify({
        logger,
        https: process.env['SSL_KEY'] ? {
            key: fs.readFileSync(process.env['SSL_KEY'],'utf8'),
            cert: fs.readFileSync(process.env['SSL_CERT'],'utf8')
        } : undefined
    })

    await fastify.register(import('@fastify/rate-limit'), { global: false })

    const staticFilesFolder = path.join(process.cwd(), 'public')
    fastify.log.info("Static files are served from folder " + staticFilesFolder)
    await fastify.register(import('@fastify/static'), {
        root: staticFilesFolder
    })

    fastify.setErrorHandler( (error, request, reply) => {
        if (error.statusCode) {
            logger.info(`Error: Status ${error.statusCode}, Message: ${error.message}`, error)
            reply.status(error.statusCode).send(error.message)
        } else {
            logger.warn(`Error: ${error.message}`, error)
            reply.status(500).send(error.message)
        }
    })

    fastify.route(rewardsEndpoint)

    fastify.listen({ port: Number(process.env['PORT'] || 3000) , host: '0.0.0.0' }, (err) => {
        if (err) {
            fastify.log.error(err)
            process.exit(1)
        }
    })
}

init()
