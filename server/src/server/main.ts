import Fastify from "fastify";
import path from "path";
import { logger } from "./logger/logger";
import dotenv from "dotenv";
dotenv.config({ path: __dirname + "/../../.env" });

import * as fs from "fs";
import { stakingRewardsEndpoint } from "./endpoints/staking-rewards.endoint";
import { paymentsEndpoint } from "./endpoints/payments.endpoint";
import { HttpError } from "../common/error/HttpError";

const init = async () => {
  const fastify = Fastify({
    logger,
    https: process.env["SSL_KEY"]
      ? {
          key: fs.readFileSync(process.env["SSL_KEY"], "utf8"),
          cert: fs.readFileSync(process.env["SSL_CERT"], "utf8"),
        }
      : undefined,
  });

  await fastify.register(import("@fastify/rate-limit"), { global: false });

  fastify.addHook("onRequest", (request, reply, done) => {
    if (
      JSON.parse(
        fs.readFileSync(__dirname + "/../../res/realtime-config.json", "utf-8"),
      ).maintenanceMode &&
      request.url.indexOf("/maintenance") == -1
    ) {
      reply.header("Content-Type", "text/html");
      reply
        .send(
          fs.readFileSync(
            __dirname + "/../../public/maintenance.html",
            "utf-8",
          ),
        )
        .status(200);
    }
    done();
  });

  const staticFilesFolder = path.join(process.cwd(), "public");
  if (fs.existsSync(staticFilesFolder)) {
    fastify.log.info(
      "Static files are served from folder " + staticFilesFolder,
    );
    await fastify.register(import("@fastify/static"), {
      root: staticFilesFolder,
    });
  }

  fastify.get("/api/res/subscan-chains", function (req, reply) {
    reply.sendFile(
      "subscan-chains.json",
      path.join(__dirname, "../../res/gen"),
    );
  });

  fastify.setErrorHandler((error, request, reply) => {
    if (error.statusCode) {
      logger.error(
        `Error: Status ${error.statusCode}, Message: ${error.message}${(error as HttpError)?.requestUrl ? ", Request Url: " + (error as HttpError)?.requestUrl : ""}`,
        error,
      );
      reply.status(error.statusCode).send(error.message);
    } else {
      logger.warn(`Error: ${error.message}`, error);
      if (error.stack) {
        logger.error(error.stack);
      }
      reply.status(500).send(error.message);
    }
  });

  fastify.route(stakingRewardsEndpoint as any);
  fastify.route(paymentsEndpoint as any);

  fastify.setNotFoundHandler((request, reply) => {
    // TODO: implement better solution
    reply.header("Content-Type", "text/html");
    reply
      .send(fs.readFileSync(staticFilesFolder + "/index.html", "utf-8"))
      .status(200);
  });

  fastify.listen(
    { port: Number(process.env["PORT"] || 3001), host: "0.0.0.0" },
    (err) => {
      if (err) {
        fastify.log.error(err);
        process.exit(1);
      }
    },
  );
};

init();
