import {logger} from "../logger/logger";
import * as fs from 'fs';
import {formatDate} from "../util/format-date";
import { CoingeckoService } from "../coingecko-api/coingecko.service";
import { findCoingeckoToken } from "../util/find-coingecko-token-id";

export interface Quotes {
    [isoDate:string]: number;
    timestamp: number;
    latest: number;
}

export interface CurrencyQuotes {
    currency: string;
    quotes: Quotes
}

const MAX_AGE = 4 * 60 * 60 * 1000

export class TokenPriceHistoryService {
    private static cachedPrices: { [tokenIdCurrency: string]: Quotes } = {}
    private static timer

    constructor(private coingeckoService: CoingeckoService) {
    }

    public init() {
        logger.info('Initalizing TokenPriceHistoryService')
        if (!TokenPriceHistoryService.timer) {
            TokenPriceHistoryService.timer = setInterval(() => this.sync(), 3 * 60 * 1000)
        }
        this.sync()
    }

    async getQuotes(symbol: string, chain: string, currency: string = 'usd'): Promise<CurrencyQuotes> {
        symbol = symbol.toLowerCase()
        if (this.synonyms[symbol]) {
            symbol = this.synonyms[symbol]
        }
        const result = await this.fetchQuotesForSymbol(symbol, currency)
        this.addTokenToSyncList(symbol)
        return { quotes: result, currency }
    }

    private getTokensToSync() {
        if (fs.existsSync(__dirname + '/../../res/quotes/tokens-to-sync.json')) {
            return JSON.parse(fs.readFileSync(__dirname + '/../../res/quotes/tokens-to-sync.json', 'utf-8'))
        } else {
            return {
                tokens: [
                    "glmr",
                    "intr",
                    "glmr",
                    "kint",
                    "ksm",
                    "pha",
                    "bnc",
                    "link",
                    "aca",
                    "op",
                    "eth",
                    "velo",
                    "bal",
                    "usdc",
                    "matic",
                    "wom",
                    "ldo",
                    "sushi",
                    "usdt",
                    "dai",
                    "dot",
                    "wbtc",
                    "frax",
                    "well"
                ]
            }
        }
    }

    private currenciesToSync = ['usd', 'eur', 'chf']

    private synonyms = {
        'wglmr': 'glmr',
        'weth': 'eth',
        'wsteth': 'steth',
        'ibtc': 'btc',
        'kbtc': 'btc'
    }

    private async sync() {
        logger.info('TokenPriceHistoryService syncing')
        const tokensToSync = this.getTokensToSync()
        for (let currency of this.currenciesToSync) {
            for (let symbol of tokensToSync.tokens) {
                const symbolCurr = symbol + '_' + currency
                try {
                    if (!TokenPriceHistoryService.cachedPrices[symbolCurr]) {
                        this.fetchStoredQuotes(symbolCurr)
                    }
                    if (!this.informationUpToDate(symbolCurr)) {
                        await this.fetchQuotesForSymbol(symbol, currency)
                        logger.info(`TokenPriceHistoryService syncing done for token ${symbol} and currency ${currency}`)
                        break;
                    }
                } catch (error) {
                    if (error.statusCode === 404) {
                        tokensToSync.tokens.splice(tokensToSync.tokens.findIndex(t => t === symbol), 1)
                    }
                    logger.error(`Error syncing token ${symbol} for currency ${currency}`, error)
                    logger.error(error)
                    break;
                }
            }
        }
        if (tokensToSync.tokens.every(tokenId => 
            this.currenciesToSync.every(currency => this.informationUpToDate(tokenId + '_' + currency))
        )) {
            logger.info(`TokenPriceHistoryService syncing completed!`)
        }
    }

    private addTokenToSyncList(symbol: string) {

        const tokensToSync = this.getTokensToSync()
        if (tokensToSync.tokens.indexOf(symbol) === -1) {
            tokensToSync.tokens.push(symbol)
            fs.writeFileSync(__dirname + '/../../res/quotes/tokens-to-sync.json', JSON.stringify(tokensToSync), 'utf-8')
        }
    }

    private informationUpToDate(tokenIdCurrency: string) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1);

        return TokenPriceHistoryService.cachedPrices[tokenIdCurrency]
            && (TokenPriceHistoryService.cachedPrices[tokenIdCurrency][formatDate(yesterday)]
            || new Date().getTime() - TokenPriceHistoryService.cachedPrices[tokenIdCurrency].timestamp < MAX_AGE)
    }


    private async fetchQuotesForSymbol(symbol: string, currency: string = 'usd') {
        if (this.informationUpToDate(symbol)) {
            return TokenPriceHistoryService.cachedPrices[symbol]
        }
        const token = findCoingeckoToken(symbol, 'polkadot')
        if (!token) {
            throw new Error("Token " + symbol + " not found in coingecko list.")
        }
        const quotes: Quotes = await this.coingeckoService.fetchHistoricalData(token.id, currency)
        const symbolCurr = symbol + '_' + currency
        this.storeQuotes(symbolCurr, quotes)
        TokenPriceHistoryService.cachedPrices[symbolCurr] = quotes
        return TokenPriceHistoryService.cachedPrices[symbolCurr]
    }

    private storeQuotes(symbolCurr: string, quotes: any) {
        const filename = __dirname + `/../../res/quotes/${symbolCurr.toLowerCase()}.json`
        const existingQuotes = fs.existsSync(filename) ?
            JSON.parse(fs.readFileSync(filename, 'utf-8')) : {}
        const updatedQuotes = {
            ...existingQuotes,
            ...quotes,
        }
        fs.writeFileSync(filename, JSON.stringify(updatedQuotes), 'utf-8')
    }

    private fetchStoredQuotes(symbolCurrency: string) {
        const filename = __dirname + `/../../res/quotes/${symbolCurrency.toLowerCase()}.json`
        if (fs.existsSync(filename)) {
            TokenPriceHistoryService.cachedPrices[symbolCurrency] = JSON.parse(fs.readFileSync(filename, 'utf-8'))
        }
    }

}

