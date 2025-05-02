import { ExchangeRateRestService } from "../exchange-rate-api/exchange-rate.rest-service";
import { ExchangeRates } from "../../model/fiat-exchange-rates/exchange-rates";
import { logger } from "../../common/logger/logger";
import { formatDate } from "../../common/util/date-utils";

export class FiatExchangeRateService {
  exchangeRates: ExchangeRates = {};

  constructor(private exchangeRateRestService: ExchangeRateRestService) {}

  async init() {
    await this.sync();
    setInterval(
      async () => {
        try {
          await this.sync();
        } catch (error) {
          logger.error(error);
        }
      },
      12 * 60 * 60 * 1000,
    );
  }

  private endOfYearOrNow(year: number) {
    const d = new Date();
    d.setFullYear(year);
    d.setMonth(11);
    d.setDate(31);
    if (d.getTime() < Date.now()) {
      return `${year}-12-31`;
    }
    return formatDate(new Date());
  }

  private async sync() {
    logger.info("CurrencyExchangeRateService syncing");
    let results: ExchangeRates = this.exchangeRates;
    // fetch data from 10 years back if it hasn't been stored yet. otherwise fetch current and last year
    const yearsToLookPast = Object.keys(results).length === 0 ? 10 : 1;
    for (let yearInPast = 0; yearInPast <= yearsToLookPast; yearInPast++) {
      let year = new Date().getFullYear() - yearInPast;
      results = {
        ...results,
        ...(await this.exchangeRateRestService.fetchTimeSeries(
          `${year}-01-01`,
          this.endOfYearOrNow(year),
        )),
      };
    }
    this.exchangeRates = results;
  }
}
