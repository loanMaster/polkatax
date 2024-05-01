import fetch from 'node-fetch';
import {HttpError} from "../error/HttpError";
import {logger} from "../logger/logger";

export class CryptoCompareService {
    async fetchHistoryRange(tokenSymbol: string, currency: string, from: string): Promise<[{ time: number, close: number }]> {
        if (currency.toLowerCase() != 'usd') {
            throw Error("Only usd is supported to fetch quotes from cryptocompareservice")
        }

        logger.info(`CryptoCompareService.fetchHistoryRange for ${tokenSymbol.toUpperCase()}, ${currency.toUpperCase()} from ${from}`)
        const request = `https://min-api.cryptocompare.com/data/v2/histoday?fsym=${tokenSymbol.toUpperCase()}&tsym=${currency.toUpperCase()}&limit=750&aggregate=1`
        const response = await fetch(request, {
            method: 'get'
        });
        if (!response.ok) {
            throw new HttpError(response.status, response.statusText)
        }
        const responseJson = await response.json() as any
        return responseJson.Data.Data
    }
}
