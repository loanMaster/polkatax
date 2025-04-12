import { CoingeckoRestService } from "./coingecko-api/coingecko.rest-service";
import { CurrencyQuotes } from "./model/crypto-currency-quotes";
import { TokenPriceHistoryService } from "./services/token-price-history.service";
import { TokenPriceService } from "./services/token-price.service";

export class CryptoCurrencyPricesFacade {
    private tokenPriceService: TokenPriceService;
    private tokenPriceHistoryService: TokenPriceHistoryService;

    constructor(coingeckoService: CoingeckoRestService) {
        this.tokenPriceHistoryService = new TokenPriceHistoryService(coingeckoService);
        this.tokenPriceService = new TokenPriceService(coingeckoService)
    }

    init() {
        this.tokenPriceHistoryService.init();
    }

    async fetchCurrentPrices(symbols: string[], chain: string, currency: string): Promise<{ [symbol: string]: number }> {
        return this.tokenPriceService.fetchCurrentPrices(symbols, chain, currency);
    }

    async getHistoricPrices(symbol: string, chain: string, currency: string = 'usd'): Promise<CurrencyQuotes> {
        return this.tokenPriceHistoryService.getHistoricPrices(symbol, chain, currency);
    }
}