import fetch from 'node-fetch';
import {HttpError} from "../error/HttpError";
import {logger} from "../logger/logger";

export class CoingeckoService {
    async fetchHistoryRange(tokenId: string, currency: string, from: number, to:number): Promise<number[][]> {
        logger.info(`CoingeckoService.fetchHistoryRange for ${tokenId}, ${currency} from ${from} to ${to}`)
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart/range?vs_currency=${currency}&from=${from}&to=${to}&precision=full`, {
            method: 'get'
        });
        if (!response.ok) {
            throw new HttpError(response.status, response.statusText)
        }
        const responseJson = await response.json() as any
        return responseJson.prices
    }

    async fetchPrice(
        tokenId: string,
        currencies: string[]
    ): Promise<{[key:string]: number}> {
        logger.info(`CoingeckoService.fetchPrice for ${tokenId}`)
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=${currencies.join(',')}&precision=full`, {
            method: 'GET'
        });
        if (!response.ok) {
            throw new HttpError(response.status, response.statusText)
        }
        return (await response.json())[tokenId.toLowerCase()];
    }

    async fetchPrices(tokenIds: string[], currency: string): Promise<{[tokenId: string]: { [currency: string]: number }}> {
        logger.info(`CoingeckoService.fetchPrices for ${tokenIds.join(',')}`)
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${tokenIds.join(',')}&vs_currencies=${currency}&include_market_cap=false&include_24hr_vol=false&include_24hr_change=false&include_last_updated_at=false`, {
            method: 'GET'
        })
        if (!response.ok) {
            throw new HttpError(response.status, response.statusText)
        }
        return response.json()
    }

}
