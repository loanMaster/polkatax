import fetch from 'node-fetch';
import {ExchangeRates} from "../model/exchange-rates";
import { HttpError } from '../../common/error/HttpError';
import { logger } from '../../common/logger/logger';

export class ExchangeRateRestService {
    async fetchTimeSeries(isoDateStart: string, isoDateEnd: string): Promise<ExchangeRates> {
        logger.info(`ExchangeRateService.fetchTimeSeries from ${isoDateStart} to ${isoDateEnd}`)
        const response = await fetch(`http://api.exchangerate.host/timeframe?start_date=${isoDateStart}&end_date=${isoDateEnd}&base=usd&access_key=${process.env['EXCHANGERATE_HOST_API_KEY']}`, {
            method: 'get'
        });
        if (!response.ok) {
            throw new HttpError(response.status, response.statusText)
        }
        const responseJson = await response.json()
        const exchangeRates: ExchangeRates = {}
        for (let date of Object.keys(responseJson?.quotes || {})) {
            exchangeRates[date] = {}
            for (let currency of Object.keys(responseJson.quotes[date])) {
                exchangeRates[date][currency.substring(3)] = responseJson.quotes[date][currency]
            }
        }
        return exchangeRates
    }
}
