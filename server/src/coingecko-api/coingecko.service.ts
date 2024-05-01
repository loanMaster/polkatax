import fetch from 'node-fetch';
import {HttpError} from "../error/HttpError";
import {logger} from "../logger/logger";

export class CoingeckoService {
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
