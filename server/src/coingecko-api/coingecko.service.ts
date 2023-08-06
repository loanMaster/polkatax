import fetch from 'node-fetch';
import {HttpError} from "../error/HttpError";

export class CoingeckoService {
    async fetchHistory(tokenId: string, isoDate: string): Promise<{ [key: string]: number }> {
        const dateParts = isoDate.split('-')
        const queryDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/${tokenId}/history?date=${queryDate}&localization=false`, {
            method: 'get'
        });
        if (!response.ok) {
            throw new HttpError(response.status, response.statusText)
        }
        const responseJson = await response.json() as any
        return responseJson?.market_data?.current_price
    }

    async fetchHistoryRange(tokenId: string, currency: string, from: number, to:number): Promise<number[][]> {
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
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=${currencies.join(',')}&precision=full`, {
            method: 'GET'
        });
        if (!response.ok) {
            throw new HttpError(response.status, response.statusText)
        }
        return (await response.json())[tokenId.toLowerCase()];
    }

}
