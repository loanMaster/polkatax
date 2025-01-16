import fs from "fs";
import {ExchangeRateService} from "../exchange-rate-api/exchange-rate.service";
import {ExchangeRates} from "../exchange-rate-api/exchange-rates";
import {logger} from "../logger/logger";
import {formatDate} from "../util/format-date";

export class CurrencyExchangeRateService {
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
        const exchangeRatesService = new ExchangeRateService()
        let results: ExchangeRates = this.getExchangeRates()
        // fetch data from 10 years back if it hasn't been stored yet. otherwise fetch current and last year
        const yearsToLookPast = Object.keys(results).length === 0 ? 10 : 1
        for (let yearInPast = 0; yearInPast  <= yearsToLookPast; yearInPast++) {
            let year = new Date().getFullYear() - yearInPast
            results = {
                ...results,
                ...(await exchangeRatesService.fetchTimeSeries(`${year}-01-01`, this.endOfYearOrNow(year)))
            }
        }
        fs.writeFileSync(__dirname + '/../../res/quotes/currency-exchange.rates.json', JSON.stringify(results))
    }

    getExchangeRates(): ExchangeRates {
        if (fs.existsSync(__dirname + '/../../res/quotes/currency-exchange.rates.json')) {
            return JSON.parse(fs.readFileSync(__dirname + '/../../res/quotes/currency-exchange.rates.json', 'utf8'))
        } else {
            return {}
        }
    }
}
