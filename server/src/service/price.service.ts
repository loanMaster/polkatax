import {logger} from "../logger/logger";
import {fiatCurrencies} from "../const/fiat-currencies";
import {CoingeckoService} from "../coingecko-api/coingecko.service";

interface CachedPrice {
    [key: string]: number;
    timestamp: number;
}

const MAX_AGE = 2 * 60 * 60 * 1000

export class PriceService {
    private static quotes: { [key: string]: CachedPrice } = {}

    constructor(private coingeckoService: CoingeckoService) {
    }

    async fetchCurrentPrice(tokenId: string, currency: string): Promise<number> {
        if (PriceService.quotes[tokenId] && new Date().getTime() - PriceService.quotes[tokenId].timestamp < MAX_AGE) {
            return PriceService.quotes[tokenId][currency.toLowerCase()]
        }
        try {
            PriceService.quotes[tokenId] = {
                ...await this.coingeckoService.fetchPrice(tokenId, fiatCurrencies),
                timestamp: new Date().getTime()
            }
        } catch (error) {
            if (error instanceof Response) {
                logger.warn(`Error when fetching price from coingecko: ${error.status}, ${error.statusText}`)
            }
            if (!PriceService.quotes[tokenId]) {
                throw error
            }
        }
        return PriceService.quotes[tokenId][currency.toLowerCase()]
    }
}
