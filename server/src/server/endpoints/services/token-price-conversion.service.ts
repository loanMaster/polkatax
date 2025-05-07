import { logger } from "../../logger/logger";
import { CurrencyQuotes } from "../../../model/crypto-currency-prices/crypto-currency-quotes";
import { CryptoCurrencyPricesService } from "./crypto-currency-prices.service";
import { FiatExchangeRateService } from "./fiat-exchange-rate.service";
import {
  PreferredQuoteCurrency,
  preferredQuoteCurrencyValues,
} from "../../../model/preferred-quote-currency";

export class TokenPriceConversionService {
  constructor(
    private cryptoCurrencyPricesService: CryptoCurrencyPricesService,
    private fiatExchangeRateService: FiatExchangeRateService,
  ) {}

  private async fetchQuotesInOtherCurrency(
    multiTokenQuotes: { [token: string]: CurrencyQuotes },
    toCurrency: string,
  ): Promise<{ [token: string]: CurrencyQuotes }> {
    const fiatExchangeRates =
      await this.fiatExchangeRateService.fetchExchangeRates();
    const quotesInTargetCurrency: { [token: string]: CurrencyQuotes } = {};

    Object.keys(multiTokenQuotes).forEach((token) => {
      quotesInTargetCurrency[token] = {
        quotes: {
          timestamp: multiTokenQuotes[token].quotes.timestamp,
          latest: multiTokenQuotes[token].quotes.latest,
        },
        currency: toCurrency,
      };
      Object.keys(multiTokenQuotes[token].quotes)
        .filter((key) => key !== "timestamp" && key !== "latest")
        .forEach(
          (timestamp) =>
            (quotesInTargetCurrency[token].quotes[timestamp] =
              multiTokenQuotes[token].quotes[timestamp] *
              fiatExchangeRates[timestamp][toCurrency.toUpperCase()]),
        );
    });
    return quotesInTargetCurrency;
  }

  public async fetchQuotesForTokens(
    tokens: string[],
    chain: string,
    currency: string,
  ): Promise<{ [token: string]: CurrencyQuotes }> {
    const quotesCurrency =
      preferredQuoteCurrencyValues.indexOf(currency.toLowerCase()) > -1
        ? currency
        : "usd";
    const result = {};
    const latestPrices =
      await this.cryptoCurrencyPricesService.fetchCurrentPrices(
        tokens,
        chain,
        currency,
      );
    for (let i = 0; i < tokens.length; i++) {
      try {
        result[tokens[i]] =
          await this.cryptoCurrencyPricesService.fetchHistoricalPrices(
            tokens[i],
            quotesCurrency as PreferredQuoteCurrency,
          );
        result[tokens[i]].quotes.latest = latestPrices[tokens[i]];
      } catch (e) {
        logger.error("Failed to fetch quotes for token " + tokens[i]);
        logger.error(e);
      }
    }
    if (preferredQuoteCurrencyValues.indexOf(currency.toLowerCase()) > -1) {
      return result;
    }
    return this.fetchQuotesInOtherCurrency(result, currency);
  }
}
