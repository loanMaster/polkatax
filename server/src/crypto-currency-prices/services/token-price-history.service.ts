import {logger} from "../../common/logger/logger";
import * as fs from 'fs';
import {CoingeckoRestService} from "../coingecko-api/coingecko.rest-service";
import { findCoingeckoToken } from "../../common/util/find-coingecko-token-id";
import { CurrencyQuotes, Quotes } from "../model/crypto-currency-quotes";
import * as substrateTokenToCoingeckoId from "../../../res/substrate-token-to-coingecko-id.json"
import { formatDate } from "../../common/util/date-utils";

const MAX_AGE = 4 * 60 * 60 * 1000

const data_folder = __dirname + '/../../../res/gen/crypto-currencies-quotes/'

export class TokenPriceHistoryService {
    private static cachedPrices: { [symbolCurrency: string]: Quotes } = {}
    private static timer

    constructor(private coingeckoRestService: CoingeckoRestService) {
    }

    public init() {
        logger.info('Initalizing TokenPriceHistoryService')
        if (!TokenPriceHistoryService.timer) {
            TokenPriceHistoryService.timer = setInterval(() => this.sync(), 3 * 60 * 1000)
        }
        this.sync()
    }

    async getHistoricPrices(symbol: string, currency: 'usd' | 'chf' | 'eur' = 'usd'): Promise<CurrencyQuotes> {
        symbol = symbol.toLowerCase()
        if (this.synonyms[symbol]) {
            symbol = this.synonyms[symbol]
        }
        const result = await this.fetchQuotesForSymbol(symbol, currency)
        this.addTokenToSyncList(symbol)
        return { quotes: result, currency }
    }

    private getTokensToSync() {
        if (fs.existsSync(data_folder + 'tokens-to-sync.json')) {
            return JSON.parse(fs.readFileSync(data_folder + 'tokens-to-sync.json', 'utf-8'))
        } else {
            
            return {
                tokens: [
                    ...substrateTokenToCoingeckoId.tokens.map(t => t.token),
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
                    if (!this.informationUpToDate(symbol, currency)) {
                        await this.fetchQuotesForSymbol(symbol, currency)
                        logger.info(`TokenPriceHistoryService syncing done for token ${symbol} and currency ${currency}`)
                        break;
                    }
                } catch (error) {
                    if (error.statusCode === 404) {
                        tokensToSync.tokens.splice(tokensToSync.tokens.findIndex(t => t === symbol), 1)
                    }
                    logger.warn(`Error syncing token ${symbol} for currency ${currency}`, error)
                    logger.warn(error)
                    break;
                }
            }
        }
        if (tokensToSync.tokens.every(symbol => 
            this.currenciesToSync.every(currency => this.informationUpToDate(symbol, currency))
        )) {
            logger.info(`TokenPriceHistoryService syncing completed!`)
        }
    }

    private combine(symbol: string, currency: string) {
        return symbol + '_' + currency
    }

    private addTokenToSyncList(symbol: string) {
        const tokensToSync = this.getTokensToSync()
        if (tokensToSync.tokens.indexOf(symbol) === -1) {
            tokensToSync.tokens.push(symbol)
            fs.writeFileSync(data_folder + 'tokens-to-sync.json', JSON.stringify(tokensToSync), 'utf-8')
        }
    }

    private informationUpToDate(symbol: string, currency: string) {
        const combinedIdx = this.combine(symbol, currency)
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1);

        return TokenPriceHistoryService.cachedPrices[combinedIdx]
            && (TokenPriceHistoryService.cachedPrices[combinedIdx][formatDate(yesterday)]
            || new Date().getTime() - TokenPriceHistoryService.cachedPrices[combinedIdx].timestamp < MAX_AGE)
    }


    private async fetchQuotesForSymbol(symbol: string, currency: string = 'usd') {
        if (this.informationUpToDate(symbol, currency)) {
            return TokenPriceHistoryService.cachedPrices[this.combine(symbol, currency)]
        }
        const token = findCoingeckoToken(symbol, 'polkadot')
        if (!token) {
            throw new Error("Token " + symbol + " not found in coingecko list.")
        }
        const quotes: Quotes = await this.coingeckoRestService.fetchHistoricalData(token.id, currency)
        const symbolCurr = symbol + '_' + currency
        this.storeQuotes(symbolCurr, quotes)
        TokenPriceHistoryService.cachedPrices[symbolCurr] = quotes
        return TokenPriceHistoryService.cachedPrices[symbolCurr]
    }

    private storeQuotes(symbolCurr: string, quotes: any) {
        const filename = data_folder + `${symbolCurr.toLowerCase()}.json`
        const existingQuotes = fs.existsSync(filename) ?
            JSON.parse(fs.readFileSync(filename, 'utf-8')) : {}
        const updatedQuotes = {
            ...existingQuotes,
            ...quotes,
        }
        fs.writeFileSync(filename, JSON.stringify(updatedQuotes), 'utf-8')
    }

    private fetchStoredQuotes(symbolCurrency: string) {
        const filename = data_folder + `${symbolCurrency.toLowerCase()}.json`
        if (fs.existsSync(filename)) {
            TokenPriceHistoryService.cachedPrices[symbolCurrency] = JSON.parse(fs.readFileSync(filename, 'utf-8'))
        }
    }

}

