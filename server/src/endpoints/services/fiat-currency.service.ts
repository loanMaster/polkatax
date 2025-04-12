import {logger} from "../../common/logger/logger";
import {Transfer} from "../../common/model/transfer";
import {Swap} from "../../common/model/swap";
import { formatDate } from "../../common/util/format-date";
import { CryptoCurrencyPricesFacade } from "../../crypto-currency-prices/crypto-currency-prices.facade";
import { CurrencyQuotes } from "../../crypto-currency-prices/model/crypto-currency-quotes";
import { FiatExchangeRateService } from "../../fiat-currencies/fiat-exchange-rate.service";

export class FiatCurrencyService {

    private supportedQuoteCurrencies = ["usd", "eur", "chf"]

    constructor(private cryptoCurrencyPricesFacade: CryptoCurrencyPricesFacade, private fiatExchangeRateService: FiatExchangeRateService) {
    }

    async addFiatValues(values: Transfer[], fromSymbol: string, chain: string, toCurrency: string, currentPrice: number, quotesIn?: CurrencyQuotes): Promise<Transfer[]> {
        try {
            toCurrency = toCurrency.toUpperCase()
            const quotesCurrency = this.supportedQuoteCurrencies.indexOf(toCurrency.toLowerCase()) > -1 ? toCurrency : 'usd'
            const quotes = quotesIn ? quotesIn : await this.cryptoCurrencyPricesFacade.getHistoricPrices(fromSymbol, chain, quotesCurrency.toLowerCase())
            const currencyExchangeRates = await this.fiatExchangeRateService.getExchangeRates()
            const currentIsoDate = formatDate(new Date())

            for (let d of values) {
                const isoDate = formatDate(new Date(d.date * 1000))
                if (isoDate === currentIsoDate) {
                    d.price = currentPrice
                    d.value = d.amount * currentPrice
                } else if (quotes.quotes?.[isoDate] && (quotes.currency.toUpperCase() === toCurrency || currencyExchangeRates[isoDate]?.[toCurrency])) {
                    d.price = quotes.quotes[isoDate] * (quotes.currency.toUpperCase() === toCurrency ? 1 : currencyExchangeRates[isoDate][toCurrency])
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

    public async getQuotesForTokens(tokens: string[], chain: string, currency: string): Promise<{ [token: string]: CurrencyQuotes }> {
        const result = {}
        for (let i = 0; i < tokens.length; i++) {
            try {
                result[tokens[i]] = await this.cryptoCurrencyPricesFacade.getHistoricPrices(tokens[i], chain, currency)
            } catch (e) {
                logger.error("Failed to fetch quotes for token " + tokens[i])
                logger.error(e)
            }
        }
        return result
    }

    async addFiatValuesToSwaps(swaps: Swap[], toCurrency: string, chain:  string, currentPrices: { [token: string]: number }): Promise<Swap[]> {
        const tokens = this.getTokens(swaps)
        toCurrency = toCurrency.toUpperCase()
        const quotesCurrency = this.supportedQuoteCurrencies.indexOf(toCurrency.toLowerCase()) > -1 ? toCurrency : 'usd'
        const quotes = await this.getQuotesForTokens(tokens, chain, quotesCurrency.toLowerCase())
        for (let idx = 0; idx < swaps.length; idx++) {
            const swap = swaps[idx]
            const currencyExchangeRates = await this.fiatExchangeRateService.getExchangeRates()
            const currentIsoDate = formatDate(new Date())
            const isoDate = formatDate(new Date(swap.date * 1000))
            for (const token of Object.keys(swap.tokens)) {
                const tokenQuotes = quotes[token]
                if (isoDate === currentIsoDate) {
                    swap.tokens[token].price = currentPrices?.[token]
                    swap.tokens[token].value = swap.tokens[token].amount * swap.tokens[token].price
                } else if (tokenQuotes && tokenQuotes.quotes[isoDate] && (quotesCurrency === toCurrency || currencyExchangeRates[isoDate]?.[toCurrency])) {
                    swap.tokens[token].price = tokenQuotes.quotes[isoDate] * (quotesCurrency === toCurrency ? 1 : currencyExchangeRates[isoDate][toCurrency])
                    swap.tokens[token].value = swap.tokens[token].amount * swap.tokens[token].price
                } else if (isoDate !== currentIsoDate && tokenQuotes) {
                    logger.warn(`No quote found for ${token} for date ${isoDate}`)
                }
            }
        }
        return swaps
    }

}
