import {logger} from "../logger/logger";
import {CurrencyExchangeRateService} from "./currency-exchange-rate.service";
import {Quotes, TokenPriceHistoryService} from "./token-price-history.service";
import {Transfer} from "../model/transfer";
import {formatDate} from "../util/format-date";
import {Swap} from "../model/swap";

export class FiatCurrencyService {

    constructor(private tokenPriceHistoryService: TokenPriceHistoryService, private currencyExchangeRateService: CurrencyExchangeRateService) {
    }

    async addFiatValues(values: Transfer[], fromSymbol: string, chain: string, toSymbol: string, currentPrice: number, quotesIn?: Quotes): Promise<Transfer[]> {
        try {
            const quotes = quotesIn ? quotesIn : await this.tokenPriceHistoryService.getQuotes(fromSymbol, chain)
            const currencyExchangeRates = await this.currencyExchangeRateService.getExchangeRates()
            const currentIsoDate = formatDate(new Date())

            for (let d of values) {
                const isoDate = formatDate(new Date(d.date * 1000))
                if (isoDate === currentIsoDate) {
                    d.price = currentPrice
                    d.value = d.amount * currentPrice
                } else if (quotes?.[isoDate] && (toSymbol.toUpperCase() === 'USD' || currencyExchangeRates[isoDate]?.[toSymbol.toUpperCase()])) {
                    d.price = quotes[isoDate] * (toSymbol.toUpperCase() === 'USD' ? 1 : currencyExchangeRates[isoDate][toSymbol.toUpperCase()])
                    d.value = d.amount * d.price
                } else if (isoDate !== currentIsoDate) {
                    logger.warn(`No quote found for ${fromSymbol} for date ${isoDate}`)
                }
            }
            return values
        } catch (e) {
            logger.error("Failed to fetch quotes for token " + fromSymbol)
            logger.error(e)
            return values
        }
    }

    public getTokens(swaps: Swap[]): string[] {
        const tokens = []
        swaps.forEach(s => {
            Object.keys(s.tokens).forEach(t => {
                if (tokens.indexOf(t) === -1) {
                    tokens.push(t)
                }
            })
        })
        return tokens
    }

    public async getQuotesForTokens(tokens: string[], chain: string): Promise<{ [token: string]: Quotes }> {
        const result = {}
        for (let i = 0; i < tokens.length; i++) {
            try {
                result[tokens[i]] = await this.tokenPriceHistoryService.getQuotes(tokens[i], chain)
            } catch (e) {
                logger.error("Failed to fetch quotes for token " + tokens[i])
                logger.error(e)
            }
        }
        return result
    }

    async addFiatValuesToSwaps(swaps: Swap[], toCurrency: string, chain:  string, currentPrices: { [token: string]: number }): Promise<Swap[]> {
        const tokens = this.getTokens(swaps)
        const quotes = await this.getQuotesForTokens(tokens, chain)
        for (let idx = 0; idx < swaps.length; idx++) {
            const swap = swaps[idx]
            const currencyExchangeRates = await this.currencyExchangeRateService.getExchangeRates()
            const currentIsoDate = formatDate(new Date())
            const isoDate = formatDate(new Date(swap.date * 1000))
            for (const token of Object.keys(swap.tokens)) {
                if (isoDate === currentIsoDate) {
                    swap.tokens[token].price = currentPrices?.[token]
                    swap.tokens[token].value = swap.tokens[token].amount * swap.tokens[token].price
                } else if (quotes[token]?.[isoDate] && (toCurrency.toUpperCase() === 'USD' || currencyExchangeRates[isoDate]?.[toCurrency.toUpperCase()])) {
                    swap.tokens[token].price = quotes[token][isoDate] * (toCurrency.toUpperCase() === 'USD' ? 1 : currencyExchangeRates[isoDate][toCurrency.toUpperCase()])
                    swap.tokens[token].value = swap.tokens[token].amount * swap.tokens[token].price
                } else if (isoDate !== currentIsoDate && quotes[token]) {
                    logger.warn(`No quote found for ${token} for date ${isoDate}`)
                }
            }
        }
        return swaps
    }

}
