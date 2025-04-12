import { findCoingeckoToken } from "../../common/util/find-coingecko-token-id";
import {CoingeckoRestService} from "../coingecko-api/coingecko.rest-service";

const MAX_AGE = 6 * 60 * 60 * 1000

export class TokenPriceService {
    private static quotes: { [tokenId: string]: { [currency: string]: { price: number, timestamp: number } } } = {}

    constructor(private coingeckoService: CoingeckoRestService) {
    }

    private hasAllQuotes(tokens: { id: string }[], currency: string) {
        return tokens.every(token => {
            return TokenPriceService.quotes[token.id]?.[currency.toLowerCase()]?.price !== undefined
                && new Date().getTime() - TokenPriceService.quotes[token.id]?.[currency.toLowerCase()].timestamp < MAX_AGE
        })
    }

    private getCachedPrices(tokens: { id: string, symbol: string }[], currency: string): { [currency: string]: number } {
        const response = {}
        tokens.forEach(token => {
            response[token.id] = response[token.id] || {}
            response[token.id][currency] = TokenPriceService.quotes[token.id]?.[currency.toLowerCase()].price
        })
        return response
    }

    async fetchCurrentPrices(symbols: string[], chain: string, currency: string): Promise<{ [symbol: string]: number }> {
        const tokens = symbols.map(s => findCoingeckoToken(s, chain))
        const refresh = !this.hasAllQuotes(tokens, currency)
        const response = refresh ? await this.coingeckoService.fetchPrices(tokens.map(token => token.id), currency.toLowerCase())
            : this.getCachedPrices(tokens, currency)
        const final = {}
        for (const token of tokens) {
            if (refresh) {
                TokenPriceService.quotes[token.id] = TokenPriceService.quotes[token.id] || {}
                TokenPriceService.quotes[token.id][currency] = {
                    price: response[token.id][currency.toLowerCase()],
                    timestamp: new Date().getTime()
                }
            }
            final[token.symbol] = response[token.id][currency.toLowerCase()]
        }
        return final
    }
}
