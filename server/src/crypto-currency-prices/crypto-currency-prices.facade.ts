import { CurrencyQuotes } from "./model/crypto-currency-quotes";
import { TokenPriceHistoryService } from "./services/token-price-history.service";
import { TokenPriceService } from "./services/token-price.service";

export class CryptoCurrencyPricesFacade {
    constructor(private tokenPriceHistoryService: TokenPriceHistoryService, private tokenPriceService: TokenPriceService) {
    }

    init() {
        this.tokenPriceHistoryService.init();
    }

    async fetchCurrentPrices(symbols: string[], chain: string, currency: string): Promise<{ [symbol: string]: number }> {
        return this.tokenPriceService.fetchCurrentPrices(symbols, chain, currency);
    }

    async getHistoricPrices(symbol: string, currency: 'usd' | 'chf' | 'eur' = 'usd'): Promise<CurrencyQuotes> {
        return this.tokenPriceHistoryService.getHistoricPrices(symbol, currency);
    }
}