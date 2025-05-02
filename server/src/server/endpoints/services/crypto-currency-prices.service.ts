import { RequestHelper } from "../../../common/util/request.helper";
import { CurrencyQuotes } from "../../../model/crypto-currency-prices/crypto-currency-quotes";

export class CryptoCurrencyPricesService {
  get port() {
    return process.env["CRYPTO_CURRENCY_PRICES_PORT"] || 3003;
  }

  fetchCurrentPrices(
    symbols: string[],
    chain: string,
    currency: string,
  ): Promise<{ [symbol: string]: number }> {
    return new RequestHelper().req(
      `https://localhost:${this.port}/current-prices`,
      "POST",
      { symbols, chain, currency },
    );
  }

  fetchHistoricalPrices(
    symbol: string,
    currency: string,
  ): Promise<CurrencyQuotes> {
    return new RequestHelper().req(
      `https://localhost:${this.port}/historic-prices/${symbol}?currency=${currency}`,
      "GET",
      {},
    );
  }
}
