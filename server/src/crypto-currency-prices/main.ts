import Fastify, { FastifyRequest } from "fastify";
import { logger } from "./logger/logger";
import dotenv from "dotenv";
dotenv.config({ path: __dirname + "/../../.env" });
import { TokenPriceHistoryService } from "./services/token-price-history.service";
import { TokenPriceService } from "./services/token-price.service";
import { CurrentPriceRequest } from "../model/crypto-currency-prices/current-price-request";
import { DIContainer } from "./di-container";
import { PreferredQuoteCurrency } from "../model/preferred-quote-currency";

export const cryptoCurrencyPricesServer = {
  init: async () => {
    const tokenPriceHistoryService: TokenPriceHistoryService =
      DIContainer.resolve("tokenPriceHistoryService");
    const tokenPriceService: TokenPriceService =
      DIContainer.resolve("tokenPriceService");

    tokenPriceHistoryService.init();

    const fastify = Fastify({
      logger,
    });

    fastify.route({
      method: "POST",
      url: "/crypto-current-prices",
      handler: async (
        request: FastifyRequest<{ Body: CurrentPriceRequest }>,
      ) => {
        const { symbols, chain, currency } = request.body;
        return tokenPriceService.fetchCurrentPrices(symbols, chain, currency);
      },
    });

    fastify.route({
      method: "GET",
      url: "/crypto-historic-prices/:symbol",
      handler: async (
        request: FastifyRequest<{
          Params: { symbol: string };
          Querystring: { currency: PreferredQuoteCurrency };
        }>,
      ) => {
        const { symbol } = request.params;
        const { currency } = request.query;
        return tokenPriceHistoryService.getHistoricPrices(symbol, currency);
      },
    });

    fastify.listen(
      { port: Number(process.env["CRYPTO_CURRENCY_PRICES_PORT"] || 3003) },
      (err) => {
        if (err) {
          fastify.log.error(err);
          process.exit(1);
        }
      },
    );
  },
};

cryptoCurrencyPricesServer.init();
