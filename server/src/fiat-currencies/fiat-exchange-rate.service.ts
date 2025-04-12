import fs from "fs";
import { ExchangeRateRestService } from "./exchange-rate-api/exchange-rate.rest-service";
import { ExchangeRates } from "./model/exchange-rates";
import { formatDate } from "../common/util/format-date";
import { logger } from "../common/logger/logger";

const currencyExchangeRatesFileName = __dirname + '/../../res/fiat-currencies/quotes/currency-exchange.rates.json'

export class FiatExchangeRateService {
    constructor(private exchangeRatesRestService: ExchangeRateRestService) {
    }

    async init() {
        await this.sync()
        setInterval(async () => {
            try {
                await this.sync()
            } catch (error) {
                logger.error(error)
            }
        }, 12 * 60 * 60 * 1000)
    }

    private endOfYearOrNow(year: number) {
        const d = new Date()
        d.setFullYear(year)
        d.setMonth(11)
        d.setDate(31)
        if (d.getTime() < Date.now()) {
            return `${year}-12-31`
        }
        return formatDate(new Date)
    }

    private async sync() {
        logger.info('CurrencyExchangeRateService syncing')
        let results: ExchangeRates = this.getExchangeRates()
        // fetch data from 10 years back if it hasn't been stored yet. otherwise fetch current and last year
        const yearsToLookPast = Object.keys(results).length === 0 ? 10 : 1
        for (let yearInPast = 0; yearInPast  <= yearsToLookPast; yearInPast++) {
            let year = new Date().getFullYear() - yearInPast
            results = {
                ...results,
                ...(await this.exchangeRatesRestService.fetchTimeSeries(`${year}-01-01`, this.endOfYearOrNow(year)))
            }
        }
        fs.writeFileSync(currencyExchangeRatesFileName, JSON.stringify(results))
    }

    getExchangeRates(): ExchangeRates {
        if (fs.existsSync(currencyExchangeRatesFileName)) {
            return JSON.parse(fs.readFileSync(currencyExchangeRatesFileName, 'utf8'))
        } else {
            return {}
        }
    }
}
