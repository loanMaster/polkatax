import { logger } from "../logger/logger";
import { CoingeckoRestService } from "../coingecko-api/coingecko.rest-service";
import { findCoingeckoToken } from "../../common/util/find-coingecko-token-id";
import {
  CurrencyQuotes,
  Quotes,
} from "../../model/crypto-currency-prices/crypto-currency-quotes";
import * as substrateTokenToCoingeckoId from "../../../res/substrate-token-to-coingecko-id.json";
import { formatDate } from "../../common/util/date-utils";
import {
  PreferredQuoteCurrency,
  preferredQuoteCurrencyValues,
} from "../../model/preferred-quote-currency";

const MAX_AGE = 4 * 60 * 60 * 1000;

export class TokenPriceHistoryService {
  private cachedPrices: { [symbolCurrency: string]: Quotes } = {};
  private timer;
  private tokensToSync = [
    ...substrateTokenToCoingeckoId.tokens.map((t) => t.token),
    "op",
    "eth",
    "velo",
    "bal",
    "usdc",
    "matic",
    "wom",
    "ldo",
    "sushi",
    "usdt",
    "dai",
    "wbtc",
    "frax",
    "well",
  ];

  constructor(private coingeckoRestService: CoingeckoRestService) {}

  public init() {
    logger.info("Initalizing TokenPriceHistoryService");
    if (!this.timer) {
      this.timer = setInterval(() => this.sync(), 3 * 60 * 1000);
    }
    this.sync();
  }

  async getHistoricPrices(
    symbol: string,
    currency: PreferredQuoteCurrency = "usd",
  ): Promise<CurrencyQuotes> {
    symbol = symbol.toLowerCase();
    if (this.synonyms[symbol]) {
      symbol = this.synonyms[symbol];
    }
    const result = await this.fetchQuotesForSymbol(symbol, currency);
    this.addTokenToSyncList(symbol);
    return { quotes: result, currency };
  }

  private currenciesToSync = preferredQuoteCurrencyValues;

  private synonyms = {
    wglmr: "glmr",
    weth: "eth",
    wsteth: "steth",
    ibtc: "btc",
    kbtc: "btc",
  };

  private async sync() {
    logger.info("TokenPriceHistoryService syncing");
    const tokensToSync = [...this.tokensToSync];
    for (let currency of this.currenciesToSync) {
      for (let symbol of tokensToSync) {
        try {
          if (!this.informationUpToDate(symbol, currency)) {
            await this.fetchQuotesForSymbol(symbol, currency);
            logger.info(
              `TokenPriceHistoryService syncing done for token ${symbol} and currency ${currency}`,
            );
            break;
          }
        } catch (error) {
          logger.warn(
            `Error syncing token ${symbol} for currency ${currency}`,
            error,
          );
          logger.warn(error);
          this.tokensToSync = this.tokensToSync.filter((t) => t !== symbol);
          break;
        }
      }
    }
    if (
      tokensToSync.every((symbol) =>
        this.currenciesToSync.every((currency) =>
          this.informationUpToDate(symbol, currency),
        ),
      )
    ) {
      logger.info(`TokenPriceHistoryService syncing completed!`);
    }
  }

  private combine(symbol: string, currency: string) {
    return symbol + "_" + currency;
  }

  private addTokenToSyncList(symbol: string) {
    const tokensToSync = this.tokensToSync;
    if (tokensToSync.indexOf(symbol) === -1) {
      tokensToSync.push(symbol);
    }
  }

  private informationUpToDate(symbol: string, currency: string) {
    const combinedIdx = this.combine(symbol, currency);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    return (
      this.cachedPrices[combinedIdx] &&
      (this.cachedPrices[combinedIdx][formatDate(yesterday)] ||
        new Date().getTime() - this.cachedPrices[combinedIdx].timestamp <
          MAX_AGE)
    );
  }

  private async fetchQuotesForSymbol(symbol: string, currency: string = "usd") {
    if (this.informationUpToDate(symbol, currency)) {
      return this.cachedPrices[this.combine(symbol, currency)];
    }
    const token = findCoingeckoToken(symbol, "polkadot", logger);
    if (!token) {
      throw new Error("Token " + symbol + " not found in coingecko list.");
    }
    const quotes: Quotes = await this.coingeckoRestService.fetchHistoricalData(
      token.id,
      currency,
    );
    const symbolCurr = symbol + "_" + currency;
    this.cachedPrices[symbolCurr] = quotes;
    return this.cachedPrices[symbolCurr];
  }
}
