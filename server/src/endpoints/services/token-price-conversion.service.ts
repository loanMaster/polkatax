import {logger} from "../../common/logger/logger";
import { CryptoCurrencyPricesFacade } from "../../crypto-currency-prices/crypto-currency-prices.facade";
import { CurrencyQuotes } from "../../crypto-currency-prices/model/crypto-currency-quotes";
import { FiatExchangeRateService } from "../../fiat-currencies/fiat-exchange-rate.service";

export class TokenPriceConversionService {

    private supportedQuoteCurrencies = ["usd", "eur", "chf"]

    constructor(private cryptoCurrencyPricesFacade: CryptoCurrencyPricesFacade, private fiatExchangeRateService: FiatExchangeRateService) {
    }

    private async fetchQuotesInOtherCurrency(multiTokenQuotes: { [token: string]: CurrencyQuotes }, toCurrency: string): Promise<{ [token: string]: CurrencyQuotes }> {
        const fiatExchangeRates = await this.fiatExchangeRateService.getExchangeRates();
        const quotesInTargetCurrency: { [token: string]: CurrencyQuotes } = {};

        Object.keys(multiTokenQuotes).forEach(token => {
            quotesInTargetCurrency[token] = {
                quotes: {
                    timestamp: multiTokenQuotes[token].quotes.timestamp,
                    latest: multiTokenQuotes[token].quotes.latest
                },
                currency: toCurrency
            }
            Object.keys(multiTokenQuotes[token].quotes).filter(key => key !== 'timestamp' && key !== 'latest').forEach(timestamp => (
                quotesInTargetCurrency[token].quotes[timestamp] = multiTokenQuotes[token].quotes[timestamp] * fiatExchangeRates[timestamp][toCurrency.toUpperCase()]
            ))
        })
        return quotesInTargetCurrency
    }

    public async fetchQuotesForTokens(tokens: string[], chain: string, currency: string): Promise<{ [token: string]: CurrencyQuotes }> {
        const quotesCurrency = this.supportedQuoteCurrencies.indexOf(currency.toLowerCase()) > -1 ? currency : 'usd'
        const result = {}
        const latestPrices = await this.cryptoCurrencyPricesFacade.fetchCurrentPrices(tokens, chain, currency);
        for (let i = 0; i < tokens.length; i++) {
            try {
                result[tokens[i]] = await this.cryptoCurrencyPricesFacade.getHistoricPrices(tokens[i], quotesCurrency as 'usd' | 'chf' | 'eur')
                result[tokens[i]].quotes.latest = latestPrices[tokens[i]]
            } catch (e) {
                logger.error("Failed to fetch quotes for token " + tokens[i])
                logger.error(e)
            }
        }
        if (this.supportedQuoteCurrencies.indexOf(currency.toLowerCase()) > -1) {
            return result
        }
        return this.fetchQuotesInOtherCurrency(result, currency)
    }
}
